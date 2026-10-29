<?php
namespace ChatFlow\Admin;

use ChatFlow\Mcp\McpModule;
use ChatFlow\Templates\Imajiner;

/** Admin reference: the context an AI agent needs to build a valid ChatFlow form. */
final class AiGuide {
	public const SLUG = 'cff-ai-guide';

	public static function url(): string {
		return add_query_arg( 'page', self::SLUG, admin_url( 'admin.php' ) );
	}

	public static function enqueue(): void {
		wp_register_style( 'cff-ai-guide', false, array(), CFF_VERSION );
		wp_enqueue_style( 'cff-ai-guide' );
		wp_add_inline_style(
			'cff-ai-guide',
			'#cff-ai-guide{max-width:960px}#cff-ai-guide .cff-guide-card{background:#fff;border:1px solid #dcdcde;border-radius:8px;padding:8px 24px 20px;margin:20px 0}'
			. '#cff-ai-guide pre{background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px;padding:12px;overflow:auto;white-space:pre}'
			. '#cff-ai-guide textarea{width:100%;font-family:monospace}#cff-ai-guide li{margin-bottom:6px}'
			. '#cff-ai-guide .cff-guide-status{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600}'
			. '#cff-ai-guide .is-on{background:#edfaef;color:#00650f}#cff-ai-guide .is-off{background:#fcf0f1;color:#8a2424}'
			. '#cff-ai-guide .cff-guide-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}'
		);
		wp_register_script( 'cff-ai-guide', false, array(), CFF_VERSION, true );
		wp_enqueue_script( 'cff-ai-guide' );
		wp_add_inline_script(
			'cff-ai-guide',
			'document.addEventListener("click",function(e){var b=e.target.closest("[data-cff-copy]");if(!b)return;var t=document.getElementById(b.getAttribute("data-cff-copy"));if(!t)return;'
			. 'var done=function(){var l=b.textContent;b.textContent=b.getAttribute("data-copied");setTimeout(function(){b.textContent=l;},1500);};'
			. 'if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t.value||t.textContent).then(done);}else{t.select&&t.select();document.execCommand("copy");done();}});'
		);
	}

	public static function render(): void {
		$mcp_on   = McpModule::enabled();
		$settings = current_user_can( 'cff_manage_settings' ) ? add_query_arg( 'page', 'cff-settings', admin_url( 'admin.php' ) ) : '';
		$schema   = static fn( string $name ): string => plugins_url( 'schema/' . $name . '.schema.json', CFF_FILE );
		$example  = self::exampleFile();

		echo '<div class="wrap" id="cff-ai-guide">';
		echo '<h1>' . esc_html__( 'Build forms with an AI agent', 'chatflow-forms' ) . '</h1>';
		echo '<p>' . esc_html__( 'An agent needs two kinds of context: the format (what valid output looks like) and your brief (what this form should do). The plugin can supply most of the format itself.', 'chatflow-forms' ) . '</p>';

		// Option 1: MCP.
		echo '<div class="cff-guide-card"><h2>' . esc_html__( 'Option 1: Connect the agent to ChatFlow (recommended)', 'chatflow-forms' ) . '</h2>';
		echo '<p>' . esc_html__( 'ChatFlow includes an MCP server, so agents such as Claude Code, Cursor or VS Code can read the format, check their own work and save drafts:', 'chatflow-forms' ) . '</p><ul class="ul-disc">';
		echo '<li><code>get_form_schema</code> — ' . esc_html__( 'the form and settings formats, field types and an example form.', 'chatflow-forms' ) . '</li>';
		echo '<li><code>validate_form</code> — ' . esc_html__( 'schema errors, publish blockers and logic warnings, without saving.', 'chatflow-forms' ) . '</li>';
		echo '<li><code>create_form</code> / <code>update_form</code> — ' . esc_html__( 'save drafts only. Visitors see nothing until you publish.', 'chatflow-forms' ) . '</li></ul>';
		echo '<p><strong>' . esc_html__( 'MCP server on this site:', 'chatflow-forms' ) . '</strong> ';
		echo $mcp_on
			? '<span class="cff-guide-status is-on">' . esc_html__( 'On', 'chatflow-forms' ) . '</span>'
			: '<span class="cff-guide-status is-off">' . esc_html__( 'Off', 'chatflow-forms' ) . '</span>';
		echo '</p><ol>';
		echo '<li>' . esc_html__( 'Turn on the MCP server in Site defaults → Integrations and AI.', 'chatflow-forms' );
		if ( $settings ) {
			echo ' <a href="' . esc_url( $settings ) . '">' . esc_html__( 'Open Site defaults', 'chatflow-forms' ) . '</a>';
		}
		echo '</li>';
		echo '<li>' . esc_html__( 'Create an application password for the account the agent should act as.', 'chatflow-forms' ) . ' <a href="' . esc_url( admin_url( 'profile.php#application-passwords-section' ) ) . '">' . esc_html__( 'Open your profile', 'chatflow-forms' ) . '</a></li>';
		echo '<li>' . esc_html__( 'Add this endpoint to your agent (Streamable HTTP, Basic authorization with the username and application password):', 'chatflow-forms' ) . '<pre>' . esc_html( McpModule::url() ) . '</pre></li></ol>';
		echo '<p>' . esc_html__( 'Then tell the agent:', 'chatflow-forms' ) . '</p>';
		self::copyBlock( 'cff-guide-mcp-prompt', 'Call get_form_schema and list_templates first. Build the form described below, run validate_form until it reports no problems, then save it with create_form as a draft. Do not publish.', 3 );
		echo '</div>';

		// Option 2: JSON import.
		echo '<div class="cff-guide-card"><h2>' . esc_html__( 'Option 2: The agent writes a JSON file that you import', 'chatflow-forms' ) . '</h2>';
		echo '<p>' . esc_html__( 'For agents that cannot connect to your site, such as a chat window. Give the agent these files, then use Import form JSON on the new form screen.', 'chatflow-forms' ) . '</p>';
		echo '<div class="cff-guide-actions">';
		echo '<a class="button" download href="' . esc_url( $schema( 'form' ) ) . '">' . esc_html__( 'Download form schema', 'chatflow-forms' ) . '</a>';
		echo '<a class="button" download href="' . esc_url( $schema( 'settings' ) ) . '">' . esc_html__( 'Download settings schema', 'chatflow-forms' ) . '</a>';
		if ( '' !== $example ) {
			echo '<a class="button" download="chatflow-example-form.json" href="' . esc_attr( 'data:application/json;charset=utf-8,' . rawurlencode( $example ) ) . '">' . esc_html__( 'Download example form', 'chatflow-forms' ) . '</a>';
		}
		echo '<a class="button button-primary" href="' . esc_url( add_query_arg( 'page', 'cff-builder', admin_url( 'admin.php' ) ) ) . '">' . esc_html__( 'Import form JSON', 'chatflow-forms' ) . '</a>';
		echo '</div>';
		echo '<p>' . esc_html__( 'Agents copy a working example far more reliably than they read a schema. You can also export any of your own forms from the builder and use it as the example.', 'chatflow-forms' ) . '</p>';
		echo '<h3>' . esc_html__( 'The file wrapper', 'chatflow-forms' ) . '</h3><p>' . esc_html__( 'Import rejects anything that does not use this outer shape:', 'chatflow-forms' ) . '</p>';
		echo '<pre>' . esc_html(
			<<<'JSON'
{
  "format": "chatflow/form",
  "version": 1,
  "title": "Form name",
  "schema": { "schemaVersion": 1, "bot": { "name": "Ima" }, "steps": [], "endings": [] },
  "settings": { "language": "id", "completion": { "defaultEndingId": "end_main" } }
}
JSON
		) . '</pre>';
		echo '<h3>' . esc_html__( 'Rules to state explicitly', 'chatflow-forms' ) . '</h3><p>' . esc_html__( 'Agents tend to get these wrong. Paste them into your instructions:', 'chatflow-forms' ) . '</p>';
		self::copyBlock(
			'cff-guide-rules',
			<<<'RULES'
- Every field (step) needs id, key, type, label and messages. messages is the list of bot chat bubbles and is required even for statement fields.
- id (e.g. "step_budget") is what jumps target. key (e.g. "budget", lowercase with underscores) is what conditions use in "field" and what merge tags use, e.g. {{nama}}.
- Allowed field types: short_text, long_text, email, phone, number, date, single_choice, multi_choice, yes_no, rating, scale, nps, slider, file_upload, address, consent, hidden, statement, media, summary, calculated.
- Choice options each need id, label and value.
- Branching goes on a field's "logic": { "if": { "field": "<key>", "op": "eq", "value": "..." }, "then": { "action": "jump", "to": "<step id>" } }. Combine conditions with "all" or "any".
- Endings are "message" or "redirect". settings.completion.defaultEndingId must match one ending id.
- Set settings.language to the language of the built-in buttons and hints: "id", "en" or "site" (follow the page language), so buttons such as Continue match the questions.
- No webhooks, API keys or other secrets.
RULES
			,
			9
		);
		echo '</div>';

		// The brief.
		echo '<div class="cff-guide-card"><h2>' . esc_html__( 'Your brief (needed with either option)', 'chatflow-forms' ) . '</h2>';
		echo '<p>' . esc_html__( 'The format tells the agent how to build the form; only you can say what it is for. Fill in this template:', 'chatflow-forms' ) . '</p>';
		self::copyBlock(
			'cff-guide-brief',
			<<<'BRIEF'
Goal: what this form is for, and what counts as a success (a lead, a booking, feedback…)
Audience: who answers it, on which device, how much they know
Language and tone: e.g. casual Indonesian, uses "Anda", light emoji
Bot persona: name, one-line personality
Questions: what you must collect (required vs optional), in rough order
Branching: e.g. "if they have no website yet, skip the website-address question"
Validation: phone format, email optional, budget ranges as choices…
Endings: the thank-you message, a WhatsApp button, a redirect URL, using merge tags like {{nama}}
Display: inline, full page, floating launcher or popup; which pages
Constraints: keep it under N questions or about 2 minutes; privacy wording
BRIEF
			,
			11
		);
		echo '</div>';

		echo '<div class="cff-guide-card"><h2>' . esc_html__( 'Always check the result', 'chatflow-forms' ) . '</h2><ul class="ul-disc">';
		echo '<li>' . esc_html__( 'With MCP: ask the agent to run validate_form until it reports no problems.', 'chatflow-forms' ) . '</li>';
		echo '<li>' . esc_html__( 'With a file: import it as a draft, then open the Logic tab, which reports broken references, and use Preview before publishing.', 'chatflow-forms' ) . '</li>';
		echo '</ul></div>';
		echo '</div>';
	}

	private static function copyBlock( string $id, string $text, int $rows ): void {
		echo '<textarea id="' . esc_attr( $id ) . '" class="large-text code" rows="' . (int) $rows . '" readonly>' . esc_textarea( $text ) . '</textarea>';
		echo '<p><button type="button" class="button" data-cff-copy="' . esc_attr( $id ) . '" data-copied="' . esc_attr__( 'Copied', 'chatflow-forms' ) . '">' . esc_html__( 'Copy', 'chatflow-forms' ) . '</button></p>';
	}

	/** The bundled Imajiner survey as an importable file: branching, merge tags, hidden fields and ending buttons. */
	private static function exampleFile(): string {
		$definition = Imajiner::definition();
		$json       = wp_json_encode(
			array(
				'format'   => 'chatflow/form',
				'version'  => 1,
				'title'    => $definition['title'],
				'schema'   => $definition['schema'],
				'settings' => $definition['settings'],
			),
			JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
		);
		return is_string( $json ) ? $json : '';
	}
}
