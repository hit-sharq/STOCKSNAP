# Meta API notes (verified)

## Muse Spark
- Base URL: https://api.meta.ai/v1
- Model: muse-spark-1.3
- Chat Completions, OpenAI-compatible.
- Image input: input_text + input_image with image_url base64 data URL.

## SAM 3.1
- Endpoint: POST https://api.meta.ai/v1/responses
- Model: sam-3.1
- Request:
  {
    model: "sam-3.1",
    input: [{ type: "message", role: "user", content: [
      { type: "input_text", text: "<phrase>" },
      { type: "input_image", image_url: "data:image/...;base64,..." }
    ]}],
    stream: true,
    metadata: { include_confidence: "true" }
  }
- Response: output_text lane, one line per frame, records: objectId<|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..;c=..|><|mask;x=0;y=0;c=..;data=H,W,~payload|>
- Parse with @meta-sam/parser.
