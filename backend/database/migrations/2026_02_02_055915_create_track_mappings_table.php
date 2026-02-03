<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('track_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('musicbrainz_id')->unique(); // ID lagu dari MusicBrainz
            $table->string('youtube_video_id');         // ID video YouTube hasil search
            $table->string('title');                     // Judul lagu
            $table->string('artist');                    // Nama Artis
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('track_mappings');
    }
};
