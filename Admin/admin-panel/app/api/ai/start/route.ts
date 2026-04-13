import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, location } = body;

        return NextResponse.json({
            message: "Hi! 👋 I'll help you find the best service nearby. Just answer a few quick questions.",
            nextStep: 'intent',
            question: "What are you looking for today?",
            options: [
                { label: "🛒 Shopping & Groceries", value: "grocery" },
                { label: "🛠️ Home Services (Plumber, etc.)", value: "home_services" },
                { label: "📱 Electronics Repair", value: "electronics_repair" },
                { label: "🏥 Health & Wellness", value: "health" },
                { label: "🍕 Food & Dining", value: "food" },
                { label: "❓ Something else", value: "other" }
            ],
            inputMetadata: {
                type: 'selection_or_text',
                placeholder: 'e.g. Plumber, Laptop repair...'
            },
            updatedContext: { history: [], stepCount: 0 }
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to start AI session' },
            { status: 500 }
        );
    }
}
