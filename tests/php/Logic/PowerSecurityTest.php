<?php
namespace ChatFlow\Tests\Logic;

use ChatFlow\Fields\Registry;
use ChatFlow\Logic\Calculation;
use ChatFlow\Logic\Diagnostics;
use ChatFlow\Logic\Engine;
use ChatFlow\Logic\Experiments;
use PHPUnit\Framework\TestCase;

final class PowerSecurityTest extends TestCase {
	/** @return array<string,mixed> */
	private function fixture(): array {
		return json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/logic/power-variant-order.json' ), true, 512, JSON_THROW_ON_ERROR );
	}
	public function testBoundedGrammarAndForgedAnswer(): void {
		$expressions = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/power-invalid-expressions.json' ), true, 512, JSON_THROW_ON_ERROR );
		foreach ( $expressions as $expression ) {
			try {
				Calculation::calculate( $expression, array( 'amount' => 4 ) );
				$this->fail( 'Accepted invalid calculation: ' . $expression );
			} catch ( \InvalidArgumentException $e ) {
				$this->assertSame( 'Invalid calculation.', $e->getMessage() );
			}
		}
		$this->assertSame( 13, Calculation::calculate( 'answer.amount * 2 + variable.score', array( 'amount' => 4 ), array( 'score' => 5 ) ) );
		$f = $this->fixture();
		$r = ( new Engine( new Registry() ) )->replay( $f['schema'], array_merge( $f['answers'], array( 'bonus' => 999 ) ), $f['context'], 'complete' );
		$this->assertContains( 'computed_answer_tampered', array_column( $r['errors'], 'code' ) );
		$this->assertSame( 13, $r['answers']['bonus'] );
	}
	public function testInvalidDependenciesOutcomeAndExperimentOrder(): void {
		$f      = $this->fixture();
		$schema = $f['schema'];
		$schema['steps'][3]['settings']['expression'] = 'answer.unknown + 2';
		$this->assertNotEmpty( Diagnostics::diagnoseSchema( $schema ) );
		$schema = $f['schema'];
		$schema['steps'][3]['settings']['expression'] = 'answer.review + 2';
		$this->assertNotEmpty( Diagnostics::diagnoseSchema( $schema ) );
		$schema = $f['schema'];
		$schema['outcomes'][0]['endingId'] = 'missing';
		$this->assertNotEmpty( Diagnostics::diagnoseSchema( $schema ) );
		$schema = $f['schema'];
		$schema['experiments'][0]['variants'][1]['stepOrder'] = array( 'age', 'amount', 'bonus', 'score_step', 'review' );
		$this->assertNotEmpty( Diagnostics::diagnoseSchema( $schema ) );
		$schema = $f['schema'];
		$schema['experiments'][0]['variants'][1]['copy'][0]['stepId'] = 'missing';
		$this->assertNotEmpty( Diagnostics::diagnoseSchema( $schema ) );
		$this->assertSame( array(), Diagnostics::diagnoseSchema( $f['schema'] ) );
		$this->assertArrayNotHasKey( 'experiments', Experiments::applyVariant( $f['schema'], $f['schema']['experiments'][0]['variants'][1] ) );
	}
}
