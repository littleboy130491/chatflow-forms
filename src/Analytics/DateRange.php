<?php
namespace ChatFlow\Analytics;

final class DateRange {

	/** @return array{from:string,to:string,start:string,end:string} */
	public static function bounds( string $from, string $to, \DateTimeZone $timezone ): array {
		$start = \DateTimeImmutable::createFromFormat( '!Y-m-d', $from, $timezone );
		$end   = \DateTimeImmutable::createFromFormat( '!Y-m-d', $to, $timezone );
		if ( ! $start || ! $end || $start->format( 'Y-m-d' ) !== $from || $end->format( 'Y-m-d' ) !== $to || $start > $end || $start->diff( $end )->days > 366 ) {
			throw new \InvalidArgumentException( 'Choose a valid date range of at most 367 days.' );
		}
		$utc = new \DateTimeZone( 'UTC' );
		return array(
			'from'  => $from,
			'to'    => $to,
			'start' => $start->setTimezone( $utc )->format( 'Y-m-d H:i:s' ),
			'end'   => $end->modify( '+1 day' )->setTimezone( $utc )->format( 'Y-m-d H:i:s' ),
		);
	}
}
