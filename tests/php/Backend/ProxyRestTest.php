<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Fields\Registry;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Logic\Engine;
use ChatFlow\Rest\RestModule;
use ChatFlow\Rest\Settings;
use ChatFlow\Tracking\CloudflareRanges;
use ChatFlow\Tracking\IpResolver;
use ChatFlow\Tracking\Metadata;
use ChatFlow\Templates\Imajiner;
use ChatFlow\Submissions\Database;
use PHPUnit\Framework\TestCase;

final class ProxyRestTest extends TestCase {
	public function testPublicRestHandshakePatchAndResume(): void {
		$forms  = new FormRepository();
		$fields = new Registry();
		$rest   = new RestModule( $forms, new Engine( $fields ), $fields );
		$rest->register();
		do_action( 'rest_api_init', rest_get_server() );
		$definition = Imajiner::definition();
		$form       = $forms->create( 'HTTP protocol', $definition['schema'], $definition['settings'] );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		$call = static function ( $method, $path, $body = array(), $headers = array() ) {
			$r = new \WP_REST_Request( $method, '/cff/v1/' . $path );
			$r->set_header( 'Content-Type', 'application/json' );
			if ( 'GET' !== $method ) {
				$r->set_body( Database::json( (object) $body ) );
			}foreach ( $headers as $key => $value ) {
				$r->set_header( $key, $value );
			}return rest_get_server()->dispatch( $r );
		};
		$s    = null;
		try {
			wp_set_current_user( 0 );
			$public = $call( 'GET', 'forms/' . $form->id() );
			self::assertSame( 200, $public->get_status() );
			self::assertArrayNotHasKey( 'settings', $public->get_data()['form'] );
			self::assertSame( 304, $call( 'GET', 'forms/' . $form->id(), array(), array( 'If-None-Match' => $public->get_headers()['ETag'] ) )->get_status() );
			$token = $call( 'POST', 'forms/' . $form->id() . '/start-token', array( 'version' => 1 ) );
			self::assertSame( 200, $token->get_status() );
			$start_body = array(
				'formId'  => $form->id(),
				'version' => 1,
				'meta'    => (object) array(),
			);
			$key        = wp_generate_uuid4();
			$headers    = array(
				'X-CFF-Start-Token' => $token->get_data()['startToken'],
				'Idempotency-Key'   => $key,
			);
			$start      = $call( 'POST', 'sessions', $start_body, $headers );
			self::assertSame( 201, $start->get_status() );
			$s = $start->get_data();
			self::assertIsObject( $s['answers'] );
			self::assertIsObject( $s['context']['url'] );
			self::assertSame( hash( 'sha256', Database::json( $s ) ), hash( 'sha256', Database::json( $call( 'POST', 'sessions', $start_body, $headers )->get_data() ) ) );
			$patch = $call(
				'PATCH',
				'sessions/' . $s['sessionId'],
				array(
					'version'  => 1,
					'revision' => 0,
					'answers'  => (object) array( 'punya_website' => 'Belum pernah' ),
				),
				array(
					'X-CFF-Request-Token' => $s['requestToken'],
					'Idempotency-Key'     => wp_generate_uuid4(),
				)
			);
			self::assertSame( 200, $patch->get_status() );
			self::assertSame( 1, $patch->get_data()['revision'] );
			self::assertSame( 200, $call( 'POST', 'sessions/resume', array( 'formId' => $form->id() ), array( 'X-CFF-Resume-Token' => $s['resumeToken'] ) )->get_status() );
			self::assertSame( 401, $call( 'GET', 'sessions/' . $s['sessionId'] )->get_status() );
		} finally {
			if ( $s ) {
				global$wpdb;
				$id = (int) $wpdb->get_var( $wpdb->prepare( "SELECT submission_id FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ) );
				if ( $id ) {
					( new \ChatFlow\Submissions\Repository( $forms ) )->delete( $id );
				}
			}wp_delete_post( $form->id(), true );
			remove_filter( 'rest_pre_dispatch', array( $rest, 'requestBoundary' ), 10 );
			remove_filter( 'rest_post_dispatch', array( $rest, 'cacheHeaders' ), 10 );}
	}
	public function testAfterCommitRunsOnlyAfterOutermostDurableCommit(): void {
		$calls  = array();
		$result = Database::transaction(
			static function () use ( &$calls ) {
				Database::transaction(
					static function () use ( &$calls ) {
						Database::afterCommit(
							static function () use ( &$calls ) {
								$calls[] = 'committed';
							}
						);
						return true;
					}
				);
				self::assertSame( array(), $calls );
				return true;
			}
		);
		self::assertTrue( $result );
		self::assertSame( array( 'committed' ), $calls );
		Database::transaction(
			static function () use ( &$calls ) {
				Database::afterCommit(
					static function () use ( &$calls ) {
						$calls[] = 'rolled back';
					}
				);
				return Database::error( 'rollback', 'fixture', 500 );
			}
		);
		self::assertSame( array( 'committed' ), $calls );
	}
	public function testAutomaticPrivateProxyAndSpoofedHeaders(): void {
		self::assertSame( 'automatic', Settings::defaults()['proxy']['mode'] );
		$resolver = new IpResolver();
		self::assertSame(
			'203.0.113.9',
			$resolver->resolve(
				array(
					'REMOTE_ADDR'           => '203.0.113.9',
					'HTTP_CF_CONNECTING_IP' => '8.8.8.8',
					'HTTP_X_FORWARDED_FOR'  => '1.1.1.1',
				)
			)
		);
		self::assertSame(
			'8.8.8.8',
			$resolver->resolve(
				array(
					'REMOTE_ADDR'           => '127.0.0.1',
					'HTTP_X_FORWARDED_FOR'  => '1.1.1.1,8.8.8.8,10.1.2.3',
					'HTTP_CF_CONNECTING_IP' => '9.9.9.9',
				)
			)
		);
		self::assertSame(
			'8.8.4.4',
			$resolver->resolve(
				array(
					'REMOTE_ADDR'           => '::1',
					'HTTP_X_REAL_IP'        => '8.8.4.4',
					'HTTP_CF_CONNECTING_IP' => '9.9.9.9',
				)
			)
		);
		self::assertSame(
			'10.1.1.1',
			$resolver->resolve(
				array(
					'REMOTE_ADDR'          => '10.1.1.1',
					'HTTP_X_FORWARDED_FOR' => 'garbage',
				)
			)
		);
		self::assertSame(
			'1.1.1.1',
			$resolver->resolve(
				array(
					'REMOTE_ADDR'           => '173.245.48.1',
					'HTTP_CF_CONNECTING_IP' => '1.1.1.1',
				)
			)
		);
		self::assertSame(
			'2606:4700::1',
			$resolver->resolve(
				array(
					'REMOTE_ADDR'           => '2606:4700::1',
					'HTTP_CF_CONNECTING_IP' => '1.1.1.1',
				),
				array( 'mode' => 'direct' )
			)
		);
		self::assertSame(
			'173.245.48.1',
			$resolver->resolve(
				array(
					'REMOTE_ADDR'           => '173.245.48.1',
					'HTTP_CF_CONNECTING_IP' => '1.1.1.1,8.8.8.8',
				)
			)
		);
	}
	public function testCountryOnlyFromCloudflare(): void {
		$forms      = new FormRepository();
		$definition = Imajiner::definition();
		$form       = $forms->create( 'Proxy checks', $definition['schema'], $definition['settings'] );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		try {
			$metadata = new Metadata();
			self::assertArrayNotHasKey(
				'country',
				$metadata->collect(
					$form,
					array(),
					array(
						'REMOTE_ADDR'       => '127.0.0.1',
						'HTTP_CF_IPCOUNTRY' => 'ID',
					)
				)
			);
			self::assertSame(
				'ID',
				$metadata->collect(
					$form,
					array(),
					array(
						'REMOTE_ADDR'       => '173.245.48.1',
						'HTTP_CF_IPCOUNTRY' => 'ID',
					)
				)['country']
			);
		} finally {
			wp_delete_post( $form->id(), true ); }
	}
	public function testCloudflareRefreshIsAtomicBoundedAndFailClosed(): void {
		delete_option( 'cff_cloudflare_ranges' );
		$bundled = IpResolver::cloudflareRanges();
		self::assertTrue( CloudflareRanges::valid( $bundled ) );
		self::assertFalse( CloudflareRanges::valid( array_merge( $bundled, array( '1.0.0.0/0' ) ) ) );
		$urls = array();
		$mode = 'valid';
		$mock = static function ( $pre, $args, $url ) use ( &$urls, &$mode, $bundled ) {
			$urls[] = $url;
			self::assertSame( 0, $args['redirection'] );
			self::assertTrue( $args['sslverify'] );
			self::assertSame( 8192, $args['limit_response_size'] );
			$v6   = str_contains( $url, 'ips-v6' );
			$body = implode( "\n", array_filter( $bundled, static fn( $range )=>$v6 === str_contains( $range, ':' ) ) );
			if ( 'invalid' === $mode && $v6 ) {
				$body = "::/0\n::/1";
			} return array(
				'headers'  => array(),
				'body'     => $body,
				'response' => array(
					'code'    => 'redirect' === $mode ? 302 : 200,
					'message' => 'fixture',
				),
				'cookies'  => array(),
			);
		};
		add_filter( 'pre_http_request', $mock, 10, 3 );
		try {
			( new CloudflareRanges() )->refresh();
			self::assertSame( $bundled, get_option( 'cff_cloudflare_ranges' ) );
			$mode = 'invalid';
			( new CloudflareRanges() )->refresh();
			self::assertSame( $bundled, get_option( 'cff_cloudflare_ranges' ) );
			$mode = 'redirect';
			( new CloudflareRanges() )->refresh();
			self::assertSame( $bundled, get_option( 'cff_cloudflare_ranges' ) );
			self::assertSame( 'https://www.cloudflare.com/ips-v4/', $urls[0] );
			self::assertSame( 'https://www.cloudflare.com/ips-v6/', $urls[1] );
			( new CloudflareRanges() )->register();
			( new CloudflareRanges() )->schedule();
			self::assertIsInt( wp_next_scheduled( 'cff_cloudflare_refresh' ) ); } finally {
			remove_filter( 'pre_http_request', $mock, 10 );
			wp_clear_scheduled_hook( 'cff_cloudflare_refresh' );
			delete_option( 'cff_cloudflare_ranges' ); }
	}
	public function testRealRestDispatchAuthorizationAndBodyBoundary(): void {
		$fields = new Registry();
		$forms  = new FormRepository();
		$rest   = new RestModule( $forms, new Engine( $fields ), $fields );
		$rest->register();
		do_action( 'rest_api_init', rest_get_server() );
		$user = wp_insert_user(
			array(
				'user_login' => 'cff-rest-' . wp_generate_uuid4(),
				'user_pass'  => wp_generate_password( 32 ),
				'role'       => 'subscriber',
			)
		);
		try {
			$request = new \WP_REST_Request( 'GET', '/cff/v1/admin/settings' );
			wp_set_current_user( 0 );
			self::assertSame( 403, rest_get_server()->dispatch( $request )->get_status() );
			wp_set_current_user( $user );
			$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
			self::assertSame( 403, rest_get_server()->dispatch( $request )->get_status() );
			wp_get_current_user()->add_cap( 'cff_manage_settings' );
			self::assertSame( 200, rest_get_server()->dispatch( $request )->get_status() );
			$request->set_method( 'PUT' );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( '{"settings":[]}' );
			self::assertSame( 422, rest_get_server()->dispatch( $request )->get_status() );
			$request->set_header( 'Origin', 'https://evil.example' );
			self::assertSame( 403, rest_get_server()->dispatch( $request )->get_status() );
			$request->set_header( 'Origin', '' );
			$request->set_query_params( array( 'token' => 'forbidden' ) );
			self::assertSame( 400, rest_get_server()->dispatch( $request )->get_status() );
			$response = new \WP_REST_Response( array(), 200 );
			$rest->cacheHeaders( $response, rest_get_server(), $request );
			self::assertStringContainsString( 'no-store', $response->get_headers()['Cache-Control'] );
		} finally {
			wp_set_current_user( 0 );
			require_once ABSPATH . 'wp-admin/includes/user.php';
			wp_delete_user( $user );
			remove_filter( 'rest_pre_dispatch', array( $rest, 'requestBoundary' ), 10 );
			remove_filter( 'rest_post_dispatch', array( $rest, 'cacheHeaders' ), 10 ); }
	}
}
