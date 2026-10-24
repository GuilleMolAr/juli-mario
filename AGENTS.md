<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- The game lives in `src/game/` (pure level data, physics, sprites, WebAudio synth) and `src/components/game/` (React rendering); keep physics pure so it stays unit-testable.
- Characters are hand-authored pixel sprites rendered as SVG from `src/game/sprites.ts`, because image generation refuses these characters.
- Music and sound effects are synthesized with WebAudio (no audio files) and only start after a user tap, as browsers require.
