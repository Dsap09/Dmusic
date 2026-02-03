<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackMapping extends Model
{
    protected $table = 'track_mappings';

    protected $fillable = [
        'musicbrainz_id',
        'youtube_video_id',
        'title',
        'artist',
    ];
}
