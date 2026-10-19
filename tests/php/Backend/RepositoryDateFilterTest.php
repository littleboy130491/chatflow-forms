<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Submissions\Repository;

final class RepositoryDateFilterTest extends \PHPUnit\Framework\TestCase {
	/** @dataProvider invalidDates */
	public function testInvalidCalendarAndClockFiltersFailClosed( string $date ): void {
		$this->expectException( \InvalidArgumentException::class );
		( new Repository() )->where( array( 'from' => $date ) );
	}

	public static function invalidDates(): array {
		return array(
			'non-leap February' => array( '2025-02-29' ),
			'February rollover' => array( '2026-02-31' ),
			'April rollover'    => array( '2026-04-31T10:00:00Z' ),
			'clock rollover'    => array( '2026-01-01T24:00:00Z' ),
		);
	}

	public function testValidLeapDateAndOffsetDateKeepTheirUtcBounds(): void {
		$repository = new Repository();
		self::assertStringContainsString( "s.created_at>='2024-02-29 00:00:00'", $repository->where( array( 'from' => '2024-02-29' ) ) );
		self::assertStringContainsString( "s.created_at<='2024-02-29 23:59:59'", $repository->where( array( 'to' => '2024-02-29' ) ) );
		self::assertStringContainsString( "s.created_at>='2026-01-01 00:00:00'", $repository->where( array( 'from' => '2026-01-01T07:00:00+07:00' ) ) );
	}
}
