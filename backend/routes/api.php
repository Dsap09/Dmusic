<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TrackController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
|
*/

Route::post('/get-youtube-id', [TrackController::class, 'getYoutubeId']);
