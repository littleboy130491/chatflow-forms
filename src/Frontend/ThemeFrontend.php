<?php
namespace ChatFlow\Frontend;

use ChatFlow\Forms\Form;

/**
 * Lets a (child) theme replace or restyle the visitor chat without touching the plugin.
 *
 * In the active theme, ChatFlow looks for:
 *  - chatflow/frontend.js  – an ES module that calls window.ChatFlow.registerFrontend()
 *    and renders the whole chat UI (see docs/custom-frontend.md);
 *  - chatflow/frontend.css – extra styles loaded inside the chat's shadow root, for the
 *    built-in chat or a custom one.
 * Per-form files win: frontend-{slug}.js / frontend-{id}.js (and .css). The child theme
 * is searched before the parent theme.
 */
final class ThemeFrontend {
	public const DIRECTORY = 'chatflow';

	/**
	 * Theme directories to search, child theme first, as path => URL.
	 *
	 * @return array<string,string>
	 */
	public static function directories(): array {
		$dirs = array(
			get_stylesheet_directory() => get_stylesheet_directory_uri(),
			get_template_directory()   => get_template_directory_uri(),
		);
		/**
		 * Filter the directories searched for chatflow/frontend.{js,css}, as path => URL.
		 *
		 * @param array<string,string> $dirs
		 */
		$dirs = apply_filters( 'cff_theme_frontend_directories', $dirs );
		return is_array( $dirs ) ? array_filter( $dirs, static fn( $url, $path ) => is_string( $path ) && is_string( $url ) && '' !== $path, ARRAY_FILTER_USE_BOTH ) : array();
	}

	/**
	 * URL (with a cache-busting version) of the theme's frontend file for this form, or null.
	 *
	 * @param string $type 'js' or 'css'; anything else returns null.
	 */
	public static function asset( string $type, ?Form $form = null ): ?string {
		if ( ! in_array( $type, array( 'js', 'css' ), true ) ) {
			return null;
		}
		$names = array();
		if ( $form ) {
			if ( '' !== $form->slug() && preg_match( '/^[a-z0-9-]+$/', $form->slug() ) ) {
				$names[] = 'frontend-' . $form->slug() . '.' . $type;
			}
			$names[] = 'frontend-' . $form->id() . '.' . $type;
		}
		$names[] = 'frontend.' . $type;
		$found   = null;
		foreach ( self::directories() as $path => $url ) {
			foreach ( $names as $name ) {
				$file = trailingslashit( $path ) . self::DIRECTORY . '/' . $name;
				if ( is_file( $file ) && is_readable( $file ) ) {
					$found = add_query_arg( 'ver', (string) filemtime( $file ), trailingslashit( $url ) . self::DIRECTORY . '/' . $name );
					break 2;
				}
			}
		}
		/**
		 * Filter the theme frontend URL for a form ('js' or 'css'); return null to use the built-in chat.
		 *
		 * @param string|null $found
		 */
		$found = apply_filters( 'cff_theme_frontend_asset', $found, $type, $form );
		return is_string( $found ) && '' !== $found ? $found : null;
	}

	/** Script handle for a theme frontend URL (one per file, so per-form scripts can coexist). */
	public static function handle( string $url ): string {
		return 'cff-theme-frontend-' . substr( md5( $url ), 0, 10 );
	}
}
