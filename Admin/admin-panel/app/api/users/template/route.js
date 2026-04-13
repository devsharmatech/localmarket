import * as XLSX from 'xlsx';

export async function GET() {
    // Template for user import
    const rows = [
        {
            'Full Name': 'Rajesh Kumar',
            'Email': 'rajesh.kumar@example.com',
            'Phone': '9876543210',
            'State': 'Delhi',
            'City': 'New Delhi',
            'Status': 'Active',
        },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="users_template.xlsx"',
        },
    });
}
