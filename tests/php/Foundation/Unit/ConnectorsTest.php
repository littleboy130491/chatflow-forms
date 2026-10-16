<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Integrations\Connectors\Connectors;
use ChatFlow\Integrations\Connectors\Ga4;
use ChatFlow\Integrations\Connectors\HubSpot;
use ChatFlow\Integrations\Connectors\Mailchimp;
use ChatFlow\Integrations\Connectors\MetaCapi;
use ChatFlow\Integrations\Connectors\Slack;
use PHPUnit\Framework\TestCase;

final class ConnectorsTest extends TestCase {
	/** Fake key assembled at runtime so no key-shaped literal is committed. */
	private const MAILCHIMP_HEX = '0123456789abcdef';

	private function mailchimpKey(): string {
		return str_repeat( self::MAILCHIMP_HEX, 2 ) . '-us21';
	}

	/** @return array<string,mixed> */
	private function payload( array $answers = array() ): array {
		return array(
			'event'      => 'submission.completed',
			'submission' => array(
				'uuid'        => '8f7e02cc-8b85-4e89-a46c-fb9831fd74ab',
				'status'      => 'completed',
				'created_at'  => '2026-10-13T01:02:03+00:00',
				'duration_ms' => 42000,
				'ending'      => 'done',
			),
			'form'       => array(
				'id'      => 42,
				'slug'    => 'survey',
				'title'   => 'Survey <b>&</b>',
				'version' => 3,
			),
			'answers'    => $answers + array(
				'name'    => 'Budi',
				'email'   => ' Budi@Example.ORG ',
				'phone'   => '+62 812-3456-7890',
				'agree'   => true,
				'layanan' => array( 'Website', 'SEO' ),
			),
			'fields'     => array(
				array(
					'key'   => 'name',
					'label' => 'Name',
					'type'  => 'short_text',
					'value' => 'Budi',
				),
				array(
					'key'   => 'layanan',
					'label' => 'Services',
					'type'  => 'multi_choice',
					'value' => array( 'Website', 'SEO' ),
				),
			),
			'meta'       => array(
				'page_url'  => 'https://example.org/survey',
				'utm'       => array( 'source' => 'newsletter' ),
				'click_ids' => array( 'fbclid' => 'abc123' ),
			),
		);
	}

	/** @param array<string,mixed> $request */
	private function body( array $request ): array {
		return json_decode( $request['body'], true, 32, JSON_THROW_ON_ERROR );
	}

	public function testSlackPostsEscapedSummaryAndHonoursOptionalConsent(): void {
		$credentials = array( 'webhookUrl' => 'https://hooks.slack.com/services/T000/B000/XXXXXXXX' );
		$requests    = ( new Slack() )->requests( array( 'message' => 'Hi {{name}}' ), $credentials, $this->payload() );
		self::assertCount( 1, $requests );
		self::assertSame( $credentials['webhookUrl'], $requests[0]['url'] );
		$text = $this->body( $requests[0] )['text'];
		self::assertStringContainsString( '*Survey &lt;b&gt;&amp;&lt;/b&gt;*', $text );
		self::assertStringContainsString( 'Hi Budi', $text );
		self::assertStringContainsString( '• Services: Website, SEO', $text );
		self::assertSame( 'cancelled', ( new Slack() )->requests( array( 'consentField' => 'agree' ), $credentials, $this->payload( array( 'agree' => false ) ) ) );
		self::assertSame( 'connector_not_configured', ( new Slack() )->requests( array(), array( 'webhookUrl' => 'https://evil.example/services/x' ), $this->payload() ) );
	}

	public function testMailchimpRequiresConsentAndUpsertsByHashedEmail(): void {
		$config   = array(
			'listId'       => 'abc123def4',
			'emailField'   => 'email',
			'consentField' => 'agree',
			'fields'       => array(
				'FNAME' => 'name',
				'lower' => 'name',
			),
			'tags'         => array( 'chatflow', '' ),
		);
		$requests = ( new Mailchimp() )->requests( $config, array( 'apiKey' => $this->mailchimpKey() ), $this->payload() );
		self::assertCount( 2, $requests );
		self::assertSame( 'PUT', $requests[0]['method'] );
		self::assertSame( 'https://us21.api.mailchimp.com/3.0/lists/abc123def4/members/' . md5( 'budi@example.org' ), $requests[0]['url'] );
		self::assertSame( 'Basic ' . base64_encode( 'chatflow:' . $this->mailchimpKey() ), $requests[0]['headers']['Authorization'] );
		$body = $this->body( $requests[0] );
		self::assertSame( 'pending', $body['status_if_new'] );
		self::assertSame( array( 'FNAME' => 'Budi' ), $body['merge_fields'] );
		self::assertSame( array( array( 'name' => 'chatflow', 'status' => 'active' ) ), $this->body( $requests[1] )['tags'] );
		self::assertSame( 'subscribed', $this->body( ( new Mailchimp() )->requests( $config + array( 'doubleOptIn' => false ), array( 'apiKey' => $this->mailchimpKey() ), $this->payload() )[0] )['status_if_new'] );
		self::assertSame( 'cancelled', ( new Mailchimp() )->requests( $config, array( 'apiKey' => $this->mailchimpKey() ), $this->payload( array( 'agree' => 'yes' ) ) ) );
		self::assertSame( 'connector_missing_email', ( new Mailchimp() )->requests( $config, array( 'apiKey' => $this->mailchimpKey() ), $this->payload( array( 'email' => 'not-an-email' ) ) ) );
		unset( $config['consentField'] );
		self::assertSame( 'connector_not_configured', ( new Mailchimp() )->requests( $config, array( 'apiKey' => $this->mailchimpKey() ), $this->payload() ) );
		self::assertContains( 'mailchimp requires consentField.', ( new Mailchimp() )->configIssues( $config, array( 'email', 'name' ) ) );
	}

	public function testHubSpotUpsertsContactWithMappedProperties(): void {
		$requests = ( new HubSpot() )->requests(
			array(
				'emailField' => 'email',
				'fields'     => array(
					'firstname' => 'name',
					'services'  => 'layanan',
				),
			),
			array( 'accessToken' => 'pat-na1-0000000000' ),
			$this->payload()
		);
		self::assertSame( HubSpot::ENDPOINT, $requests[0]['url'] );
		self::assertSame( 'Bearer pat-na1-0000000000', $requests[0]['headers']['Authorization'] );
		$input = $this->body( $requests[0] )['inputs'][0];
		self::assertSame( 'email', $input['idProperty'] );
		self::assertSame( 'budi@example.org', $input['id'] );
		self::assertSame(
			array(
				'firstname' => 'Budi',
				'services'  => 'Website, SEO',
				'email'     => 'budi@example.org',
			),
			$input['properties']
		);
	}

	public function testGa4SendsNoAnswersAndRequiresConsent(): void {
		$credentials = array(
			'measurementId' => 'G-ABC1234',
			'apiSecret'     => 'secret_value',
		);
		$requests    = ( new Ga4() )->requests( array( 'consentField' => 'agree' ), $credentials, $this->payload() );
		self::assertStringStartsWith( 'https://www.google-analytics.com/mp/collect?measurement_id=G-ABC1234&api_secret=secret_value', $requests[0]['url'] );
		$body = $this->body( $requests[0] );
		self::assertSame( '8f7e02cc-8b85-4e89-a46c-fb9831fd74ab', $body['client_id'] );
		self::assertSame( 'generate_lead', $body['events'][0]['name'] );
		self::assertSame( 'newsletter', $body['events'][0]['params']['campaign_source'] );
		self::assertStringNotContainsString( 'Budi', $requests[0]['body'] );
		self::assertStringNotContainsString( 'example.org', strtolower( $requests[0]['body'] ) );
		self::assertSame( 'connector_not_configured', ( new Ga4() )->requests( array(), $credentials, $this->payload() ) );
	}

	public function testMetaHashesIdentifiersAndDeduplicatesByEventId(): void {
		$credentials = array(
			'pixelId'       => '123456789012',
			'accessToken'   => str_repeat( 'A', 30 ),
			'testEventCode' => 'TEST123',
		);
		$requests    = ( new MetaCapi() )->requests(
			array(
				'consentField' => 'agree',
				'emailField'   => 'email',
				'phoneField'   => 'phone',
			),
			$credentials,
			$this->payload()
		);
		self::assertSame( 'https://graph.facebook.com/' . MetaCapi::VERSION . '/123456789012/events', $requests[0]['url'] );
		self::assertStringNotContainsString( 'access_token', $requests[0]['url'] );
		$body  = $this->body( $requests[0] );
		$event = $body['data'][0];
		self::assertSame( 'Lead', $event['event_name'] );
		self::assertSame( '8f7e02cc-8b85-4e89-a46c-fb9831fd74ab', $event['event_id'] );
		self::assertSame( array( hash( 'sha256', 'budi@example.org' ) ), $event['user_data']['em'] );
		self::assertSame( array( hash( 'sha256', '6281234567890' ) ), $event['user_data']['ph'] );
		self::assertSame( 'fb.1.' . ( strtotime( '2026-10-13T01:02:03+00:00' ) * 1000 ) . '.abc123', $event['user_data']['fbc'] );
		self::assertSame( 'TEST123', $body['test_event_code'] );
		self::assertStringNotContainsString( 'Budi', $requests[0]['body'] );
	}

	public function testCredentialsAreEmptyOrCompleteAndConfigIssuesCatchMissingFields(): void {
		self::assertTrue( Connectors::validCredentials( Connectors::defaults() ) );
		self::assertTrue( Connectors::validCredentials( array( 'mailchimp' => array( 'apiKey' => $this->mailchimpKey() ) ) ) );
		self::assertFalse( Connectors::validCredentials( array( 'mailchimp' => array( 'apiKey' => 'short' ) ) ) );
		self::assertFalse( Connectors::validCredentials( array( 'ga4' => array( 'measurementId' => 'G-ABC1234' ) ) ) );
		self::assertFalse( Connectors::validCredentials( array( 'unknown' => array() ) ) );
		self::assertFalse( Connectors::validCredentials( array( 'slack' => array( 'webhookUrl' => 'https://hooks.slack.com/services/abc', 'extra' => 'x' ) ) ) );
		$schema   = array(
			'steps' => array(
				array( 'key' => 'email' ),
				array( 'key' => 'agree' ),
			),
		);
		$settings = array(
			'integrations' => array(
				'connectors' => array(
					array(
						'id'         => 'a',
						'type'       => 'hubspot',
						'enabled'    => true,
						'events'     => array( 'completed' ),
						'emailField' => 'missing',
						'fields'     => array( 'Bad Name' => 'email' ),
					),
					array(
						'id'      => 'b',
						'type'    => 'mailchimp',
						'enabled' => false,
						'events'  => array( 'completed' ),
					),
				),
			),
		);
		$messages = array_column( Connectors::issues( $settings, $schema ), 'message' );
		self::assertContains( 'hubspot emailField references a missing field.', $messages );
		self::assertContains( 'hubspot field name "Bad Name" is not valid for this provider.', $messages );
		self::assertCount( 2, $messages, 'Disabled connectors are not publish blockers.' );
	}

	public function testPlannedRespectsEventsEnabledAndConsent(): void {
		$base     = array(
			'type'         => 'slack',
			'enabled'      => true,
			'events'       => array( 'completed' ),
			'consentField' => 'agree',
		);
		$settings = array(
			'integrations' => array(
				'connectors' => array(
					array( 'id' => 'on' ) + $base,
					array(
						'id'      => 'off',
						'enabled' => false,
					) + $base,
					array(
						'id'     => 'partial',
						'events' => array( 'partial' ),
					) + $base,
				),
			),
		);
		self::assertSame( array( 'on' ), array_column( Connectors::planned( $settings, 'submission.completed', $this->payload() ), 'id' ) );
		self::assertSame( array(), Connectors::planned( $settings, 'submission.completed', $this->payload( array( 'agree' => false ) ) ) );
	}
}
