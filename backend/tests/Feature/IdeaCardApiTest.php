<?php

namespace Tests\Feature;

use App\Models\IdeaCard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IdeaCardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_create_update_and_delete_an_idea_card(): void
    {
        $createResponse = $this->postJson('/api/ideas', [
            'title' => 'Portfolio layout',
            'category' => 'Idea',
            'status' => 'Unsorted',
            'source' => 'Notebook',
            'summary' => 'Try a cleaner board layout for the portfolio.',
            'tags' => ['portfolio', 'ui'],
            'related_ids' => [],
            'x' => 120,
            'y' => 180,
            'rotation' => -1.2,
            'z' => 4,
            'accent' => '#8b5cf6',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.title', 'Portfolio layout');

        $ideaId = $createResponse->json('data.id');

        $this->patchJson("/api/ideas/{$ideaId}", [
            'status' => 'Done',
            'x' => 220,
            'y' => 260,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'Done')
            ->assertJsonPath('data.x', 220)
            ->assertJsonPath('data.y', 260);

        $this->deleteJson("/api/ideas/{$ideaId}")
            ->assertNoContent();

        $this->assertDatabaseMissing(IdeaCard::class, [
            'id' => $ideaId,
        ]);
    }
}
