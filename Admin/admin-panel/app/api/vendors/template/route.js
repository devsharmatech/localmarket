import * as XLSX from 'xlsx';

export async function GET() {
    // Template for vendor import
    const rows = [
        {
            'Shop Name': 'ABC Grocery Store',
            'Owner Name': 'John Doe',
            'Contact Number': '9876543210',
            'Email': 'john@example.com',
            'State': 'Delhi',
            'City': 'New Delhi',
            'Town': 'Central Delhi',
            'Tehsil': 'Connaught Place',
            'Sub Tehsil': 'CP',
            'Circle': 'Connaught Place',
            'Category': 'Grocery',
            'Status': 'Pending',
            'KYC Status': 'Pending',
            'Address': 'Shop 12, Main Market',
            'Landmark': 'Near Clock Tower',
            'Pincode': '110001',
        },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="vendors_template.xlsx"',
        },
    });
}
