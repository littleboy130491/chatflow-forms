<?php
namespace ChatFlow\Logic;

use ChatFlow\Forms\Form;

final class Experiments {
	/** @param array<string,mixed> $schema
	 * @param array<string,mixed> $variant
	 * @return array<string,mixed> */
	public static function applyVariant( array $schema, array $variant ): array {
		unset( $schema['experiments'] );
		foreach ( $variant['copy'] ?? array() as $copy ) {
			$found = false;
			foreach ( $schema['steps'] as &$step ) {
				if ( $step['id'] === $copy['stepId'] ) {
					$step['messages'] = $copy['messages'];
					$found            = true; }
			}
			unset( $step );
			if ( ! $found ) {
				throw new \InvalidArgumentException( 'Invalid variant.' ); }
		}
		if ( isset( $variant['stepOrder'] ) ) {
			$steps = array_column( $schema['steps'], null, 'id' );
			if ( count( $variant['stepOrder'] ) !== count( $steps ) || count( array_unique( $variant['stepOrder'] ) ) !== count( $steps ) || array_diff( $variant['stepOrder'], array_keys( $steps ) ) ) {
				throw new \InvalidArgumentException( 'Invalid variant.' ); }
			$schema['steps'] = array_map( static fn( $id ) => $steps[ $id ], $variant['stepOrder'] );
		}
		return $schema;
	}

	/** @return array{id:string,schema:array<string,mixed>} */
	public static function assign( Form $form ): array {
		foreach ( $form->schema()['experiments'] ?? array() as $experiment ) {
			if ( ! $experiment['enabled'] ) {
				continue; }
			$ticket = random_int( 1, array_sum( array_column( $experiment['variants'], 'weight' ) ) );
			foreach ( $experiment['variants'] as $variant ) {
				$ticket -= $variant['weight'];
				if ( $ticket <= 0 ) {
					return array(
						'id'     => $experiment['id'] . ':' . $variant['id'],
						'schema' => self::applyVariant( $form->schema(), $variant ),
					); }
			}
		}
		return array(
			'id'     => '',
			'schema' => $form->schema(),
		);
	}

	/** @param array<string,mixed> $schema */
	public static function withSchema( Form $form, array $schema ): Form {
		return new Form( $form->id(), $form->title(), $form->slug(), $schema, $form->settings(), $form->version(), $form->draftRevision(), $form->status() );
	}

	/** @param array<string,mixed> $answers
	 * @param array<string,mixed> $schema
	 * @return array<string,mixed> */
	public static function inputs( array $answers, array $schema ): array {
		foreach ( $schema['steps'] as $step ) {
			if ( 'calculated' === $step['type'] ) {
				unset( $answers[ $step['key'] ] ); }
		}
		return $answers;
	}
}
