<?php
namespace ChatFlow\Mcp;

/**
 * Read-only reference material for agents: the form JSON Schemas and the guides
 * for theme frontends and hooks. Files ship with the plugin; nothing site-specific.
 */
final class Resources {
	/** @return array<string,array{file:string,name:string,title:string,description:string,mimeType:string,capabilities:list<string>}> */
	private static function catalog(): array {
		$forms = array( 'cff_manage_forms' );
		return array(
			'chatflow://schema/form'           => array(
				'file'         => 'schema/form.schema.json',
				'name'         => 'form-schema',
				'title'        => 'Form schema',
				'description'  => 'JSON Schema for a form: bot, steps, logic, endings.',
				'mimeType'     => 'application/schema+json',
				'capabilities' => $forms,
			),
			'chatflow://schema/settings'       => array(
				'file'         => 'schema/settings.schema.json',
				'name'         => 'settings-schema',
				'title'        => 'Form settings schema',
				'description'  => 'JSON Schema for form settings: appearance, completion, notifications, spam, sessions.',
				'mimeType'     => 'application/schema+json',
				'capabilities' => $forms,
			),
			'chatflow://docs/custom-frontend'  => array(
				'file'         => 'docs/custom-frontend.md',
				'name'         => 'custom-frontend',
				'title'        => 'Custom frontend guide',
				'description'  => 'How a (child) theme replaces or restyles the visitor chat with chatflow/frontend.js and frontend.css.',
				'mimeType'     => 'text/markdown',
				'capabilities' => $forms,
			),
			'chatflow://examples/frontend.js'  => array(
				'file'         => 'examples/child-theme/chatflow/frontend.js',
				'name'         => 'example-frontend-js',
				'title'        => 'Example theme frontend (JS)',
				'description'  => 'A complete custom frontend: one question per card, plain DOM code.',
				'mimeType'     => 'text/javascript',
				'capabilities' => $forms,
			),
			'chatflow://examples/frontend.css' => array(
				'file'         => 'examples/child-theme/chatflow/frontend.css',
				'name'         => 'example-frontend-css',
				'title'        => 'Example theme frontend (CSS)',
				'description'  => 'Styles for the example custom frontend.',
				'mimeType'     => 'text/css',
				'capabilities' => $forms,
			),
			'chatflow://docs/hooks'            => array(
				'file'         => 'docs/hooks.md',
				'name'         => 'hooks',
				'title'        => 'Hooks and filters',
				'description'  => 'PHP actions and filters, browser events and the visitor runtime API.',
				'mimeType'     => 'text/markdown',
				'capabilities' => $forms,
			),
		);
	}

	/** @return list<array<string,string>> */
	public function definitions(): array {
		$list = array();
		foreach ( self::catalog() as $uri => $resource ) {
			if ( Tools::allowed( $resource['capabilities'] ) && is_readable( self::path( $resource['file'] ) ) ) {
				$list[] = array(
					'uri'         => $uri,
					'name'        => $resource['name'],
					'title'       => $resource['title'],
					'description' => $resource['description'],
					'mimeType'    => $resource['mimeType'],
				);
			}
		}
		return $list;
	}

	/** @return array{uri:string,mimeType:string,text:string}|null */
	public function read( string $uri ): ?array {
		$resource = self::catalog()[ $uri ] ?? null;
		if ( ! $resource || ! Tools::allowed( $resource['capabilities'] ) || ! is_readable( self::path( $resource['file'] ) ) ) {
			return null;
		}
		return array(
			'uri'      => $uri,
			'mimeType' => $resource['mimeType'],
			'text'     => (string) file_get_contents( self::path( $resource['file'] ) ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Bundled plugin file.
		);
	}

	private static function path( string $file ): string {
		return dirname( __DIR__, 2 ) . '/' . $file;
	}
}
