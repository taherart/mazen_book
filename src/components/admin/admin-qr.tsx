"use client";

import { Download } from "@/components/icons";
import { methodHref } from "@/lib/methods";
import { Qr } from "../qr";
import { Notice } from "../ui";
import { AdminHead, Panel, type AdminProps } from "./shared";

function download(n: number) {
  const svg = document.querySelector(`#qr-${n} svg`);
  if (!svg) return;
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `method-${String(n).padStart(2, "0")}-qr.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function AdminQr({ methods, siteUrl }: AdminProps) {
  return (
    <>
      <AdminHead title="رموز QR للكتاب" lead="رمز ثابت لكل طريقة يفتح صفحتها مباشرة. حمّلها بصيغة SVG لتُطبع بأي مقاس." />
      <Notice tone="brand" className="mb-6" title="الروابط ثابتة">
        كل رمز يشير إلى{" "}
        <bdi dir="ltr" className="font-bold">
          {new URL(siteUrl).host}/method/NN
        </bdi>
        . لا تغيّر النطاق بعد الطباعة، فالرمز المطبوع لا يُعدَّل.
      </Notice>
      <Panel>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {methods.map((m) => (
            <li key={m.n} id={`qr-${m.n}`} className="rounded-2xl border border-line p-3 text-center">
              <Qr value={`${siteUrl}${methodHref(m.n)}`} title={`رمز QR للطريقة ${m.n}`} className="mx-auto w-full max-w-36" />
              <p className="mt-2 truncate text-sm font-bold text-ink" title={m.title}>
                {m.n}. {m.title}
              </p>
              <button type="button" onClick={() => download(m.n)} className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
                <Download aria-hidden className="size-4" />
                SVG
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
