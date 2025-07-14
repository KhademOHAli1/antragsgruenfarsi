<?php

use yii\helpers\Html;

/**
 * @var yii\web\View $this
 * @var \app\models\forms\AntragsgruenInitSite $form
 */

/** @var \app\controllers\admin\IndexController $controller */
$controller = $this->context;

$this->title = Yii::t('manager', 'title_install');

$layout     = $controller->layoutParams;
$layout->robotsNoindex = true;

// Load our Apple-inspired wizard assets
$layout->addCSS('css/apple-wizard-farsi.css');
$layout->addJS('js/apple-wizard-farsi.js');

// Check if Farsi language is selected
$isFarsi = Yii::$app->language === 'fa';

// Use the new Apple-inspired wizard
echo $this->render('../createsiteWizard/apple-wizard', [
    'model' => $form, 
    'errors' => [], 
    'mode' => 'singlesite'
]);
