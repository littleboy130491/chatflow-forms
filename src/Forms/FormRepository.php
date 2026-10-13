<?php
namespace ChatFlow\Forms;

final class FormRepository {
	public function __construct( private SchemaValidator $validator = new SchemaValidator() ) {}

	public function getDraft( int $id ): ?Form {
		$post = get_post( $id );
		if ( ! $post || 'cff_form' !== $post->post_type || 'trash' === $post->post_status ) {
			return null;
		}
		return new Form( $id, $post->post_title, $post->post_name, $this->decode( get_post_meta( $id, '_cff_schema', true ) ), $this->decode( get_post_meta( $id, '_cff_settings', true ) ), (int) get_post_meta( $id, '_cff_version', true ), (int) get_post_meta( $id, '_cff_draft_revision', true ), $post->post_status );
	}

	public function getPublished( int $id, ?int $version = null ): ?Form {
		$post = get_post( $id );
		if ( ! $post || 'cff_form' !== $post->post_type || 'publish' !== $post->post_status ) {
			return null;
		}
		$version ??= (int) get_post_meta( $id, '_cff_version', true );
		return $this->getVersion( $id, $version );
	}

	public function getVersion( int $id, int $version ): ?Form {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT schema, settings, form_title, form_slug FROM {$wpdb->prefix}cff_form_versions WHERE form_id = %d AND version = %d", $id, $version ), ARRAY_A );
		if ( ! $row ) {
			return null;
		}
		return new Form( $id, $row['form_title'], $row['form_slug'], $this->decode( $row['schema'] ), $this->decode( $row['settings'] ), $version, (int) get_post_meta( $id, '_cff_draft_revision', true ), 'publish' );
	}

	/** @param array<string,mixed> $schema
	 *  @param array<string,mixed> $settings
	 */
	public function create( string $title, array $schema, array $settings = array() ): Form|\WP_Error {
		$errors = array_merge( $this->validator->validate( $schema ), $this->validator->validateSettings( $settings, $schema ) );
		if ( $errors ) {
			return $this->invalid( $errors );
		}
		$id = wp_insert_post(
			array(
				'post_type'   => 'cff_form',
				'post_title'  => sanitize_text_field( $title ),
				'post_status' => 'draft',
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			return $id;
		}
		$result = $this->saveDraft( $id, $schema, $settings, 0, $title );
		if ( is_wp_error( $result ) ) {
			wp_delete_post( $id, true );
		}
		return $result;
	}

	/** @param array<string,mixed> $schema
	 *  @param array<string,mixed> $settings
	 */
	public function saveDraft( int $id, array $schema, array $settings, int $expected_revision, ?string $title = null ): Form|\WP_Error {
		$errors = array_merge( $this->validator->validate( $schema ), $this->validator->validateSettings( $settings, $schema ) );
		if ( $errors ) {
			return $this->invalid( $errors );
		}
		return $this->withLock(
			$id,
			$expected_revision,
			function ( Form $draft ) use ( $id, $schema, $settings, $title ): Form|\WP_Error {
				$identity     = $this->decode( get_post_meta( $id, '_cff_identity', true ) );
				$old_entities = $this->entities( $draft->schema() );
				foreach ( $this->entities( $schema ) as $entity_id => $entity ) {
					$key = 'entity:' . $entity_id;
					if ( isset( $identity[ $key ] ) && $identity[ $key ] !== $entity && ! isset( $old_entities[ $entity_id ] ) ) {
						return new \WP_Error( 'cff_immutable_id', 'A removed ID cannot be reassigned to another entity.', array( 'status' => 422 ) );
					}
					if ( isset( $old_entities[ $entity_id ] ) && explode( ':', $old_entities[ $entity_id ] )[0] !== explode( ':', $entity )[0] ) {
						return new \WP_Error( 'cff_immutable_id', 'An ID cannot change entity kind.', array( 'status' => 422 ) );
					}
					$identity[ $key ] = $entity;
				}
				foreach ( $schema['steps'] as $step ) {
					$key = 'step:' . $step['key'];
					if ( isset( $identity[ $key ] ) && $identity[ $key ] !== $step['id'] ) {
						return new \WP_Error( 'cff_immutable_id', 'Existing field keys must keep their immutable step IDs.', array( 'status' => 422 ) );
					}
					$identity[ $key ] = $step['id'];
					foreach ( $step['options'] ?? array() as $option ) {
						$key = 'option:' . $step['id'] . ':' . $option['value'];
						if ( isset( $identity[ $key ] ) && $identity[ $key ] !== $option['id'] ) {
							return new \WP_Error( 'cff_immutable_id', 'Existing options must keep their immutable IDs.', array( 'status' => 422 ) );
						}
						$identity[ $key ] = $option['id'];
					}
				}
				update_post_meta( $id, '_cff_schema', wp_slash( wp_json_encode( $schema, JSON_THROW_ON_ERROR ) ) );
				update_post_meta( $id, '_cff_settings', wp_slash( wp_json_encode( (object) $settings, JSON_THROW_ON_ERROR ) ) );
				update_post_meta( $id, '_cff_identity', wp_slash( wp_json_encode( $identity, JSON_THROW_ON_ERROR ) ) );
				update_post_meta( $id, '_cff_draft_revision', $draft->draftRevision() + 1 );
				if ( null !== $title ) {
					$result = wp_update_post(
						array(
							'ID'         => $id,
							'post_title' => sanitize_text_field( $title ),
						),
						true
					);
					if ( is_wp_error( $result ) ) {
						return $result;
					}
				}
				return $this->getDraft( $id ) ?? new \WP_Error( 'cff_storage_error', 'Unable to reload draft.', array( 'status' => 500 ) );
			}
		);
	}

	public function publish( int $id, int $expected_revision ): Form|\WP_Error {
		global $wpdb;
		$result = $this->withLock(
			$id,
			$expected_revision,
			function ( Form $draft ) use ( $wpdb, $id ): Form|\WP_Error {
				/** @var list<string> $types */
				$types  = apply_filters( 'cff_publishable_field_types', SchemaValidator::V1_TYPES );
				$errors = array_merge( $this->validator->validatePublishable( $draft->schema(), $types ), $this->validator->validateSettings( $draft->settings(), $draft->schema() ) );
				if ( $errors ) {
					return $this->invalid( $errors );
				}
				$version  = $draft->version() + 1;
				$schema   = wp_json_encode( $draft->schema(), JSON_THROW_ON_ERROR );
				$settings = wp_json_encode( (object) $draft->settings(), JSON_THROW_ON_ERROR );
				if ( false === $wpdb->insert(
					$wpdb->prefix . 'cff_form_versions',
					array(
						'form_id'     => $id,
						'version'     => $version,
						'form_title'  => $draft->title(),
						'form_slug'   => $draft->slug(),
						'schema'      => $schema,
						'settings'    => $settings,
						'schema_hash' => hash( 'sha256', $schema ),
						'created_at'  => current_time( 'mysql', true ),
						'created_by'  => get_current_user_id(),
					),
					array( '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d' )
				) ) {
					return new \WP_Error( 'cff_storage_error', 'Unable to create a published snapshot.', array( 'status' => 500 ) );
				}
				update_post_meta( $id, '_cff_published_schema', wp_slash( $schema ) );
				update_post_meta( $id, '_cff_published_settings', wp_slash( $settings ) );
				update_post_meta( $id, '_cff_version', $version );
				update_post_meta( $id, '_cff_draft_revision', $draft->draftRevision() + 1 );
				$post = wp_update_post(
					array(
						'ID'          => $id,
						'post_status' => 'publish',
					),
					true
				);
				if ( is_wp_error( $post ) ) {
					return $post;
				}
				if ( false === $wpdb->update(
					$wpdb->prefix . 'cff_form_versions',
					array( 'form_slug' => get_post_field( 'post_name', $id, 'raw' ) ),
					array(
						'form_id' => $id,
						'version' => $version,
					),
					array( '%s' ),
					array( '%d', '%d' )
				) ) {
					return new \WP_Error( 'cff_storage_error', 'Unable to finalize the snapshot slug.', array( 'status' => 500 ) );
				}
				return $this->getPublished( $id, $version ) ?? new \WP_Error( 'cff_storage_error', 'Unable to reload snapshot.', array( 'status' => 500 ) );
			}
		);
		if ( $result instanceof Form ) {
			wp_cache_delete( 'public:' . $id, 'cff' );
			try {
				do_action( 'cff_form_published', $result );
			} catch ( \Throwable $e ) {
				error_log( 'ChatFlow: a form-published listener failed after commit.' );
			}
		}
		return $result;
	}

	/** @param callable(Form):(Form|\WP_Error) $callback */
	private function withLock( int $id, int $expected_revision, callable $callback ): Form|\WP_Error {
		global $wpdb;
		try {
			if ( false === $wpdb->query( 'START TRANSACTION' ) ) {
				throw new \RuntimeException( 'Storage transaction could not start.' );
			}
			$found = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE ID = %d AND post_type = %s FOR UPDATE", $id, 'cff_form' ) );
			clean_post_cache( $id );
			$draft = $found ? $this->getDraft( $id ) : null;
			if ( ! $draft ) {
				$result = new \WP_Error( 'cff_form_not_found', 'Form not found.', array( 'status' => 404 ) );
			} elseif ( $draft->draftRevision() !== $expected_revision ) {
				$result = new \WP_Error(
					'cff_revision_conflict',
					'The draft changed. Reload before saving.',
					array(
						'status'        => 409,
						'draftRevision' => $draft->draftRevision(),
					)
				);
			} else {
				$result = $callback( $draft );
			}
			if ( '' !== $wpdb->last_error ) {
				throw new \RuntimeException( 'Storage failed.' );
			}
			if ( is_wp_error( $result ) ) {
				$wpdb->query( 'ROLLBACK' );
			} else {
				if ( false === $wpdb->query( 'COMMIT' ) ) {
					throw new \RuntimeException( 'Storage transaction could not commit.' );
				}
			}
			return $result;
		} catch ( \Throwable $e ) {
			$wpdb->query( 'ROLLBACK' );
			return new \WP_Error( 'cff_storage_error', 'Unable to store form.', array( 'status' => 500 ) );
		} finally {
			clean_post_cache( $id );
		}
	}

	/**
	 * @param array<string,mixed> $schema
	 * @return array<string,string>
	 */
	private function entities( array $schema ): array {
		$entities = array();
		foreach ( $schema['steps'] ?? array() as $step ) {
			$entities[ $step['id'] ] = 'step:' . $step['key'];
			foreach ( $step['options'] ?? array() as $option ) {
				$entities[ $option['id'] ] = 'option:' . $step['id'] . ':' . $option['value'];
			}
		}
		foreach ( $schema['endings'] ?? array() as $ending ) {
			$entities[ $ending['id'] ] = 'ending';
			foreach ( $ending['buttons'] ?? array() as $button ) {
				$entities[ $button['id'] ] = 'button:' . $ending['id'];
			}
		}
		foreach ( $schema['groups'] ?? array() as $group ) {
			$entities[ $group['id'] ] = 'group';
		}
		return $entities;
	}

	/** @return array<string,mixed> */
	private function decode( mixed $json ): array {
		if ( ! is_string( $json ) || '' === $json ) {
			return array();
		}
		$value = json_decode( $json, true, 512, JSON_THROW_ON_ERROR );
		return is_array( $value ) ? $value : array();
	}

	/** @param list<array{path:string,code:string,message:string}> $errors */
	private function invalid( array $errors ): \WP_Error {
		return new \WP_Error(
			'cff_invalid_schema',
			'Schema validation failed.',
			array(
				'status' => 422,
				'errors' => $errors,
			)
		);
	}
}
