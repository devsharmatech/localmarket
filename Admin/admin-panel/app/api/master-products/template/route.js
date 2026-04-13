import * as XLSX from 'xlsx';

export async function GET() {
    // Minimal template for master product import
    const rows = [
        {
            'Product Name': 'Basmati Rice (1kg)',
            Brand: 'Generic',
            UOM: 'kg',
            'Default MRP': 140,
            'Image URL': 'https://example.com/image.jpg',
            // Optional: if you want row-level category mapping
            'Category ID (optional)': '',
        },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master Products');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="master_products_template.xlsx"',
        },
    });
}

