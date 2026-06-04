<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('idea_cards', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('category')->default('Idea');
            $table->string('status')->default('Unsorted');
            $table->string('source')->nullable();
            $table->text('summary');
            $table->json('tags')->nullable();
            $table->json('related_ids')->nullable();
            $table->integer('x')->default(0);
            $table->integer('y')->default(0);
            $table->decimal('rotation', 5, 2)->default(0);
            $table->integer('z')->default(1);
            $table->string('accent')->default('#8b5cf6');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idea_cards');
    }
};
