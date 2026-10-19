<?php
/** Isolated native WordPress browser embed fixtures. Never run on shared/live sites. */
if (!defined('WP_CLI') || !WP_CLI || getenv('CFF_E2E') !== '1' || !in_array(wp_parse_url(home_url(), PHP_URL_HOST), ['localhost', '127.0.0.1'], true)) {
    throw new RuntimeException('Requires localhost and CFF_E2E=1.');
}
$repo = new \ChatFlow\Forms\FormRepository();
$schema = [
    'schemaVersion' => 1,
    'bot' => ['name' => 'QA Embed Bot', 'typingSpeed' => 'off'],
    'steps' => [
        ['id'=>'qa_hidden','key'=>'qa_locked','type'=>'hidden','label'=>'Locked campaign','messages'=>[], 'defaultValue'=>'trusted-campaign','settings'=>['source'=>'default']],
        ['id'=>'qa_name','key'=>'qa_name','type'=>'short_text','label'=>'QA name','messages'=>['What is your QA name?'],'required'=>true],
        ['id'=>'qa_consent','key'=>'qa_consent','type'=>'consent','label'=>'QA consent','messages'=>['Consent must not be prefilled.'],'required'=>true],
    ],
    'endings'=>[['id'=>'qa_end','type'=>'message','messages'=>['QA fixture complete.']]],
];
$draft = $repo->create('QA admin-functions embed '.gmdate('Ymd-His'), $schema, ['completion'=>['defaultEndingId'=>'qa_end'],'spam'=>['minSeconds'=>0]]);
if (is_wp_error($draft)) throw new RuntimeException($draft->get_error_message());
$live = $repo->publish($draft->id(), $draft->draftRevision());
if (is_wp_error($live)) throw new RuntimeException($live->get_error_message());
$id=$live->id();
$pages=[];
foreach (['block'=>'<!-- wp:chatflow/form {"formId":'.$id.',"mode":"inline","height":640} /-->','elementor'=>'','php'=>cff_render_form($id, ['mode'=>'inline','height'=>640]),'custom'=>'<cff-chat data-form-id="'.$id.'" data-rest-url="'.esc_url(rest_url('cff/v1/')).'"></cff-chat><script type="module" src="'.esc_url(plugins_url('build/runtime/runtime.js', CFF_FILE)).'"></script>'] as $kind=>$content) {
    $pid=wp_insert_post(['post_type'=>'page','post_title'=>'QA admin-functions '.$kind.' '.$id,'post_name'=>'qa-admin-functions-'.$kind.'-'.$id,'post_status'=>'publish','post_content'=>$content],true);
    if(is_wp_error($pid)) throw new RuntimeException($pid->get_error_message());
    $pages[$kind]=get_permalink($pid);
    if($kind==='elementor') {
        update_post_meta($pid,'_elementor_edit_mode','builder');
        update_post_meta($pid,'_elementor_template_type','wp-page');
        update_post_meta($pid,'_elementor_version',ELEMENTOR_VERSION);
        update_post_meta($pid,'_elementor_data',wp_slash(wp_json_encode([['id'=>'qaembedsection','elType'=>'section','settings'=>[],'elements'=>[['id'=>'qaembedcolumn','elType'=>'column','settings'=>['_column_size'=>100],'elements'=>[['id'=>'qaembedwidget','elType'=>'widget','widgetType'=>'chatflow-form','settings'=>['form_id'=>$id,'mode'=>'inline','height'=>640],'elements'=>[]]]]]]])));
    }
}
// The PHP API output is stored as page HTML without changing the active theme.
// Enqueue its runtime explicitly in that isolated page, as a template normally does via cff_render_form().
$php_page=get_page_by_path('qa-admin-functions-php-'.$id);
wp_update_post(['ID'=>$php_page->ID,'post_content'=>$php_page->post_content.'<script type="module" src="'.esc_url(plugins_url('build/runtime/runtime.js',CFF_FILE)).'"></script>']);
$widgets=\Elementor\Plugin::$instance->widgets_manager->get_widget_types();
$out=['formId'=>$id,'slug'=>$live->slug(),'publicUrl'=>home_url('/chat/'.$live->slug().'/'),'pages'=>$pages,'blockRegistered'=>WP_Block_Type_Registry::get_instance()->is_registered('chatflow/form'),'elementorRegistered'=>isset($widgets['chatflow-form']),'elementorClass'=>isset($widgets['chatflow-form'])?get_class($widgets['chatflow-form']):null];
file_put_contents(getenv('CFF_QA_EMBED_OUTPUT') ?: '/home/hermes/chatflow-qa/iteration-2/admin-embed-fixture.json',wp_json_encode($out,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
WP_CLI::success('Created isolated admin-functions embedding fixtures.');
