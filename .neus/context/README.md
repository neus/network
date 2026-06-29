# Context storage

- `history.sqlite` — full chat history for retrieval when the context window is summarized.
- `terminal/` — latest integrated terminal logs (build errors, test output).

Agents may search these files when @Past Chats or terminal context is needed.