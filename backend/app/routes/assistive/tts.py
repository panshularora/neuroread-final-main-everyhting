from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.assistive.tts_service import generate_speech_audio

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    slow: bool = False


from io import BytesIO
from fastapi.responses import StreamingResponse

@router.post("/tts")
def generate_tts(request: TTSRequest):
    try:
        if not request.text or request.text.isspace():
            raise HTTPException(status_code=400, detail="Text is required for TTS.")
            
        from gtts import gTTS
        tts = gTTS(text=request.text, lang="en", slow=request.slow)
        
        mp3_fp = BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assistive/tts")
def generate_tts_assistive(request: TTSRequest):
    return generate_tts(request)