import * as XLSX from 'xlsx';

export async function GET() {
    // Template for category import
    const rows = [
        {
            'Category Name': 'Fruits & Vegetables',
            'Category ID': 'fruits_vegetables',
            'Priority': 1,
            'Visible': true,
            'Icon Name': 'fruits',
            'Icon URL': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        },
        {
            'Category Name': 'Dairy & Eggs',
            'Category ID': 'dairy_eggs',
            'Priority': 2,
            'Visible': true,
            'Icon Name': 'dairy',
            'Icon URL': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        },
        {
            'Category Name': 'Bakery',
            'Category ID': 'bakery',
            'Priority': 3,
            'Visible': true,
            'Icon Name': 'bakery',
            'Icon URL': 'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=400',
        },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="categories_template.xlsx"',
        },
    });
}
