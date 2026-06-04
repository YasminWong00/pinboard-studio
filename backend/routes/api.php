<?php

use App\Http\Controllers\IdeaCardController;
use Illuminate\Support\Facades\Route;

Route::apiResource('ideas', IdeaCardController::class);
