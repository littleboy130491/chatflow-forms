<?php
namespace ChatFlow\Logic;

final class Operators {

	/** @param array<string,mixed> $condition
	 *  @param array<string,mixed> $answers
	 *  @param array<string,mixed> $variables
	 *  @param array<string,mixed> $context
	 */
	public static function evaluateCondition( array $condition, array $answers = array(), array $variables = array(), array $context = array(), int $depth = 0 ): bool {
		if ( $depth > 64 ) {
			return false;
		}
		foreach ( array( 'all', 'any' ) as $group ) {
			if ( isset( $condition[ $group ] ) ) {
				foreach ( $condition[ $group ] as $child ) {
					$match = self::evaluateCondition( $child, $answers, $variables, $context, $depth + 1 );
					if ( ( 'all' === $group && ! $match ) || ( 'any' === $group && $match ) ) {
						return $match;
					}
				}
				return 'all' === $group;
			}
		}
		$sources = array(
			'answer'   => $answers,
			'variable' => $variables,
			'hidden'   => $context['hidden'] ?? array(),
			'url'      => $context['url'] ?? array(),
		);
		$left    = $sources[ $condition['source'] ?? 'answer' ][ $condition['field'] ?? '' ] ?? null;
		if ( 'answer' === ( $condition['source'] ?? 'answer' ) ) {
			$left = Values::choiceValue( $left );
		}
		$right = $condition['value'] ?? null;
		$op    = $condition['op'] ?? '';
		if ( in_array( $op, array( 'eq', 'neq' ), true ) ) {
			return 'eq' === $op ? Values::equal( $left, $right ) : ! Values::equal( $left, $right );
		}
		if ( in_array( $op, array( 'contains', 'not_contains', 'in', 'not_in' ), true ) ) {
			$found = false;
			if ( in_array( $op, array( 'contains', 'not_contains' ), true ) ) {
				if ( is_string( $left ) && is_string( $right ) ) {
					$found = str_contains( $left, $right );
				} elseif ( is_array( $left ) && array_is_list( $left ) ) {
					$found = self::includes( $left, $right );
				}
			} elseif ( is_array( $right ) && array_is_list( $right ) ) {
				$found = self::includes( $right, $left );
			}
			return str_starts_with( $op, 'not_' ) ? ! $found : $found;
		}
		return match ( $op ) {
			'gt' => Values::numeric( $left ) && Values::numeric( $right ) && $left > $right,
			'gte' => Values::numeric( $left ) && Values::numeric( $right ) && $left >= $right,
			'lt' => Values::numeric( $left ) && Values::numeric( $right ) && $left < $right,
			'lte' => Values::numeric( $left ) && Values::numeric( $right ) && $left <= $right,
			'between' => Values::numeric( $left ) && is_array( $right ) && count( $right ) === 2 && Values::numeric( $right[0] ?? null ) && Values::numeric( $right[1] ?? null ) && $left >= $right[0] && $left <= $right[1],
			'is_empty' => Values::empty( $left ),
			'is_not_empty' => ! Values::empty( $left ),
			'starts_with' => is_string( $left ) && is_string( $right ) && str_starts_with( $left, $right ),
			'matches' => Pattern::matches( $left, $right ),
			'date_before' => null !== Values::dateParts( $left ) && null !== Values::dateParts( $right ) && $left < $right,
			'date_after' => null !== Values::dateParts( $left ) && null !== Values::dateParts( $right ) && $left > $right,
			'age_gte' => null !== Values::age( $left, $context['now'] ?? null ) && Values::numeric( $right ) && $right >= 0 && Values::age( $left, $context['now'] ?? null ) >= $right,
			default => false,
		};
	}

	/** @param list<mixed> $values */
	private static function includes( array $values, mixed $needle ): bool {
		foreach ( $values as $value ) {
			if ( Values::equal( $value, $needle ) ) {
				return true;
			}
		}
		return false;
	}
}
