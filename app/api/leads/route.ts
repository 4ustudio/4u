import { NextResponse } from "next/server";

type LeadBody = {
  name: string;
  email: string;
  phone: string;
  course?: string;
  message?: string;
  source?: string;
};

export async function POST(request: Request) {
  try {
    const body: LeadBody = await request.json();

    const { name, email, phone, course, message, source } = body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    if (phone.trim().length < 7) {
      return NextResponse.json(
        { error: "Teléfono inválido" },
        { status: 400 }
      );
    }

    console.log("[LEAD]", {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      course: course || "",
      message: message || "",
      source: source || "web",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
