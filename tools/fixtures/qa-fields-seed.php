<?php
/** Disposable local fixture. CFF_E2E=1 wp eval-file tools/fixtures/qa-fields-seed.php */
if (!defined('WP_CLI') || !WP_CLI || getenv('CFF_E2E') !== '1' || home_url() !== 'http://localhost:8892' || DB_NAME !== 'chatflow_fields_test') { throw new RuntimeException('Only the isolated fields database on port 8892 is allowed.'); }
$forms = new \ChatFlow\Forms\FormRepository();
$check = static function ($value) { if (is_wp_error($value)) { throw new RuntimeException($value->get_error_message() . ' ' . wp_json_encode($value->get_error_data())); } return $value; };
$page = static function ($slug, $content) use ($check) { $old = get_page_by_path($slug); return $check(wp_insert_post(['ID'=>$old ? $old->ID : 0,'post_type'=>'page','post_status'=>'publish','post_title'=>$slug,'post_name'=>$slug,'post_content'=>$content], true)); };
$publish = static function ($name, $steps, $settings = []) use ($forms, $check) {
 $schema = ['schemaVersion'=>1,'bot'=>['name'=>'Fields QA','typingSpeed'=>'off'],'steps'=>$steps,'endings'=>[['id'=>'end_fields','type'=>'message','messages'=>['Fields saved.']]]];
 $settings = array_replace_recursive(['completion'=>['defaultEndingId'=>'end_fields'],'spam'=>['minSeconds'=>0],'notifications'=>['autoresponders'=>[]]],$settings);
 $draft=$check($forms->create($name,$schema,$settings)); return $check($forms->publish($draft->id(),$draft->draftRevision()));
};
$types=['short_text','long_text','email','phone','number','date','single_choice','multi_choice','yes_no','consent','hidden','statement','summary','rating','scale','nps','slider','address','media','file_upload','calculated'];
$manifest=[];
// A local raster image: no remote media/CDN requests.
$upload=wp_upload_bits('qa-fields-pixel.png', null, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9p0AAAAASUVORK5CYII='));
if ($upload['error']) { throw new RuntimeException($upload['error']); }
foreach ($types as $type) {
 $s=['id'=>'step_'.$type,'key'=>$type,'type'=>$type,'label'=>'QA '.$type,'messages'=>['Question '.$type],'required'=>!in_array($type,['hidden','statement','summary','media','calculated'],true)];
 if (in_array($type,['short_text','long_text'],true)) $s['validation']=['minLength'=>3,'maxLength'=>80];
 if ($type==='phone') $s['settings']=['country'=>'ID'];
 if ($type==='number' || $type==='slider') $s['validation']=['min'=>10,'max'=>30,'step'=>5];
 if ($type==='date') $s['validation']=['min'=>'2026-01-01','max'=>'2026-12-31'];
 if (in_array($type,['single_choice','multi_choice'],true)) { $s['options']=[['id'=>'opt_a','value'=>'alpha','label'=>'Alpha'],['id'=>'opt_b','value'=>'beta','label'=>'Beta'],['id'=>'opt_c','value'=>'other','label'=>'Other']]; if ($type==='single_choice') $s['options'][2]['isOther']=true; else $s['validation']=['minSelections'=>2,'maxSelections'=>2]; }
 if ($type==='consent') $s['settings']=['consentText'=>'I agree to local QA'];
 if ($type==='hidden') { $s['defaultValue']='private-fixture'; $s['settings']=['source'=>'default']; }
 if ($type==='media') $s['settings']=['media'=>['type'=>'image','url'=>$upload['url'],'alt'=>'Local QA pixel']];
 if ($type==='file_upload') $s['validation']=['maxBytes'=>2048,'mimeTypes'=>['text/plain']];
 $steps=[$s];
 if ($type==='calculated') { $s['settings']=['expression'=>'answer.quantity * 2 + 1']; $steps=[['id'=>'step_quantity','key'=>'quantity','type'=>'number','label'=>'Quantity','messages'=>['Quantity'],'required'=>true],$s]; }
 if (in_array($type,['hidden','statement','summary','media'],true)) $steps[]=['id'=>'step_confirm','key'=>'confirm','type'=>'short_text','label'=>'Confirm','messages'=>['Confirm local fixture'],'required'=>true];
 $live=$publish('QA fields '.$type,$steps); $slug='qa-fields-'.$type;
 $page($slug,'[chatflow id="'.$live->id().'" mode="inline"]');
 $manifest[$type]=['id'=>$live->id(),'url'=>'/'.$slug.'/','step'=>$s];
}
// Preserve existing visitor coverage without ever executing seed.php's password reset.
$target=$page('chatflow-e2e-sitewide','Local placement target');
$d=\ChatFlow\Templates\Imajiner::definition(); $d['schema']['bot']['typingSpeed']='off'; $d['settings']['spam']['minSeconds']=0; $d['settings']['notifications']['autoresponders']=[];
$d['settings']['display']=['mode'=>'launcher','theme'=>'light','height'=>600,'launcher'=>['enabled'=>true,'position'=>'right','includePageIds'=>[$target],'excludePageIds'=>[]]];
$draft=$check($forms->create('QA existing visitor',$d['schema'],$d['settings'])); $live=$check($forms->publish($draft->id(),$draft->draftRevision()));
foreach (['inline'=>'mode="inline"','launcher'=>'mode="launcher" position="left"','popup'=>'mode="popup"','popup-auto'=>'mode="popup" auto_open="1"'] as $slug=>$attrs) $page('chatflow-e2e-'.$slug,'[chatflow id="'.$live->id().'" '.$attrs.']');
$scores=[]; foreach (['rating','scale','nps','slider'] as $t) { $s=['id'=>'step_'.$t,'key'=>$t,'type'=>$t,'label'=>ucfirst($t),'messages'=>['Choose '.$t],'required'=>true]; if ($t==='slider') $s['validation']=['min'=>10,'max'=>30,'step'=>5]; $scores[]=$s; }
$schema=['schemaVersion'=>1,'bot'=>['name'=>'Feedback Bot','typingSpeed'=>'off'],'steps'=>$scores,'endings'=>[['id'=>'end_scores','type'=>'message','messages'=>['Feedback saved. Thank you!']]]];
$draft=$check($forms->create('QA existing scores',$schema,['completion'=>['defaultEndingId'=>'end_scores'],'spam'=>['minSeconds'=>0]]));$live=$check($forms->publish($draft->id(),$draft->draftRevision()));$page('chatflow-e2e-scores','[chatflow id="'.$live->id().'" mode="inline"]');
$pinned=$publish('QA pinned version',[
 ['id'=>'step_name','key'=>'name','type'=>'short_text','label'=>'Pinned name','messages'=>['Pinned name'],'required'=>true],
 ['id'=>'step_second','key'=>'second','type'=>'short_text','label'=>'Pinned second','messages'=>['Pinned second'],'required'=>true],
]);
update_option('qa_fields_pinned',$pinned->id()); $page('qa-fields-pinned','[chatflow id="'.$pinned->id().'" mode="inline"]');
update_option('permalink_structure','/%postname%/'); flush_rewrite_rules(false);
update_option('qa_fields_manifest',$manifest); WP_CLI::success('Created all '.count($manifest).' field fixtures and safe existing visitor pages; no credentials modified.');
