<?php
namespace ChatFlow\Logic;

final class Calculation {
	public const LIMIT = 1.0e12;
	public static function bounded( float|int $value ): float|int {
		if ( ! is_finite( (float) $value ) || abs( $value ) > self::LIMIT ) {
			throw new \InvalidArgumentException( 'Invalid calculation.' );
		}
		return $value;
	}

	/** @param array<string,mixed> $answers
	 *  @param array<string,mixed> $variables
	 */
	public static function calculate( string $expression, array $answers = array(), array $variables = array(), bool $syntax_only = false ): float|int {
		if ( ! strlen( $expression ) || strlen( $expression ) > 512 ) {
			throw new \InvalidArgumentException( 'Invalid calculation.' );
		}
		preg_match_all( '/(?:answer|variable)\.[a-z][a-z0-9_]{0,63}|[0-9]+(?:\.[0-9]+)?|[()+*\/-]|[^\s]/', $expression, $matches );
		$tokens = $matches[0];
		if ( count( $tokens ) > 128 ) {
			throw new \InvalidArgumentException( 'Invalid calculation.' );
		}
		$cursor = 0;
		$parse  = static function ( int $minimum = 0, int $depth = 0 ) use ( &$parse, &$cursor, $tokens, $answers, $variables, $syntax_only ): float|int {
			if ( $depth > 16 ) {
				throw new \InvalidArgumentException( 'Invalid calculation.' );
			}
			$token = $tokens[ $cursor++ ] ?? null;
			if ( '+' === $token || '-' === $token ) {
				$value = ( '-' === $token ? -1 : 1 ) * $parse( 3, $depth + 1 );
			} elseif ( '(' === $token ) {
				$value = $parse( 0, $depth + 1 );
				if ( ! isset( $tokens[ $cursor ] ) || ')' !== $tokens[ $cursor++ ] ) {
					throw new \InvalidArgumentException( 'Invalid calculation.' );
				}
			} elseif ( $token && preg_match( '/^(answer|variable)\.([a-z][a-z0-9_]{0,63})$/D', $token, $ref ) ) {
				$value = ( 'answer' === $ref[1] ? $answers : $variables )[ $ref[2] ] ?? 0;
				if ( ! Values::numeric( $value ) ) {
					throw new \InvalidArgumentException( 'Invalid calculation.' );
				}
			} elseif ( $token && preg_match( '/^[0-9]+(?:\.[0-9]+)?$/D', $token ) ) {
				$value = (float) $token;
			} else {
				throw new \InvalidArgumentException( 'Invalid calculation.' );
			}
			self::bounded( $value );
			while ( $cursor < count( $tokens ) ) {
				$op         = $tokens[ $cursor ];
				$precedence = in_array( $op, array( '+', '-' ), true ) ? 1 : ( in_array( $op, array( '*', '/' ), true ) ? 2 : 0 );
				if ( ! $precedence || $precedence < $minimum ) {
					break;
				}
				++$cursor;
				$right = $parse( $precedence + 1, $depth + 1 );
				if ( ! $syntax_only && '/' === $op && 0.0 === (float) $right ) {
					throw new \InvalidArgumentException( 'Invalid calculation.' );
				}
				$value = $syntax_only ? 1 : self::bounded(
					match ( $op ) {
					'+' => $value + $right,
					'-' => $value - $right,
					'*' => $value * $right,
					default => $value / $right }
				);
			}
			return self::bounded( $value );
		};
		$value  = $parse();
		if ( $cursor !== count( $tokens ) ) {
			throw new \InvalidArgumentException( 'Invalid calculation.' );
		}
		$value = floor( $value * 1e6 + 0.5 ) / 1e6;
		return floor( $value ) === $value ? (int) $value : $value;
	}

	/** @return list<array{source:string,key:string}> */
	public static function references( string $expression ): array {
		preg_match_all( '/(answer|variable)\.([a-z][a-z0-9_]{0,63})/', $expression, $matches, PREG_SET_ORDER );
		$refs      = array();
		$answers   = array();
		$variables = array();
		foreach ( $matches as $ref ) {
			$refs[] = array(
				'source' => $ref[1],
				'key'    => $ref[2],
			);
			if ( 'answer' === $ref[1] ) {
				$answers[ $ref[2] ] = 1;
			} else {
				$variables[ $ref[2] ] = 1; }
		}
		self::calculate( $expression, $answers, $variables, true );
		return $refs;
	}
}
