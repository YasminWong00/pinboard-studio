<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdeaCard extends Model
{
    protected $fillable = [
        'title',
        'category',
        'status',
        'source',
        'summary',
        'tags',
        'related_ids',
        'x',
        'y',
        'rotation',
        'z',
        'accent',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'related_ids' => 'array',
            'x' => 'integer',
            'y' => 'integer',
            'rotation' => 'float',
            'z' => 'integer',
        ];
    }
}
