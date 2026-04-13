import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Sample location data for template
    const sampleData = [
      {
        'State': 'Delhi',
        'City': 'New Delhi',
        'Town': 'Central Delhi',
        'Tehsil': 'Connaught Place',
        'Sub-Tehsil': 'CP',
        'Circle': 'North Circle',
      },
      {
        'State': 'Maharashtra',
        'City': 'Mumbai',
        'Town': 'Mumbai Suburban',
        'Tehsil': 'Andheri',
        'Sub-Tehsil': 'Andheri East',
        'Circle': 'Metro Circle',
      },
      {
        'State': 'Karnataka',
        'City': 'Bangalore',
        'Town': 'Bangalore Urban',
        'Tehsil': 'Bangalore North',
        'Sub-Tehsil': 'Hebbal',
        'Circle': 'South Circle',
      },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // State
      { wch: 20 }, // City
      { wch: 20 }, // Town
      { wch: 20 }, // Tehsil
      { wch: 20 }, // Sub-Tehsil
      { wch: 15 }, // Circle
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Locations');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="locations_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating locations template:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}
