import { createServer } from "node:http";

const skills = {
  groups: [
    {
      group: "ZZ Test",
      items: [
        { label: "Alpha Tool", hot: true },
        { label: "Beta Tool", hot: false },
      ],
    },
  ],
};

const rewrite = {
  variants: [
    "I keep the office running and I am moving into cloud work.",
    "Day to day I look after the office, and I am working toward cloud engineering.",
  ],
};

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    const wantsRewrite = body.includes("Return exactly 2 variants");
    const payload = wantsRewrite ? rewrite : skills;
    console.log(req.method, req.url, wantsRewrite ? "rewrite" : "skills", body.length);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: "model",
              parts: [{ text: JSON.stringify(payload) }],
            },
            finishReason: "STOP",
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 10,
          totalTokenCount: 20,
        },
      }),
    );
  });
});

server.listen(4011, "127.0.0.1", () => console.log("mock gemini on 4011"));
