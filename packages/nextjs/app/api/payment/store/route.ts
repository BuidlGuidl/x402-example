import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Get the absolute path to the zip file
    const filePath = path.join(process.cwd(), "app/api/payment/store/resume-wind-alpha.zip");

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Return the file with appropriate headers for download
    return new NextResponse(Buffer.from(fileBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="resume-wind-alpha.zip"',
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "File not found or could not be read" }, { status: 500 });
  }
}
