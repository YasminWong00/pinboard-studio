<?php

namespace App\Http\Controllers;

use App\Models\IdeaCard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IdeaCardController extends Controller
{
    private const CATEGORIES = ['Idea', 'Note', 'Reference', 'Task', 'Research'];

    private const STATUSES = ['Unsorted', 'Saved', 'In Progress', 'Done', 'Rejected', 'Archived'];

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => IdeaCard::query()
                ->orderBy('z')
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $idea = IdeaCard::create($this->validated($request));

        return response()->json([
            'data' => $idea,
        ], 201);
    }

    public function show(IdeaCard $idea): JsonResponse
    {
        return response()->json([
            'data' => $idea,
        ]);
    }

    public function update(Request $request, IdeaCard $idea): JsonResponse
    {
        $idea->update($this->validated($request, partial: true));

        return response()->json([
            'data' => $idea->refresh(),
        ]);
    }

    public function destroy(IdeaCard $idea): JsonResponse
    {
        $idea->delete();

        return response()->json(status: 204);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'category' => [$required, 'string', Rule::in(self::CATEGORIES)],
            'status' => [$required, 'string', Rule::in(self::STATUSES)],
            'source' => ['nullable', 'string', 'max:255'],
            'summary' => [$required, 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'related_ids' => ['nullable', 'array'],
            'related_ids.*' => ['integer'],
            'x' => ['sometimes', 'integer', 'min:0'],
            'y' => ['sometimes', 'integer', 'min:0'],
            'rotation' => ['sometimes', 'numeric'],
            'z' => ['sometimes', 'integer', 'min:1'],
            'accent' => ['sometimes', 'string', 'max:20'],
        ]);
    }
}
