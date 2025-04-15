from datetime import datetime
from src.extensions import db

class ProcessedAudio(db.Model):
    __tablename__ = 'processed_audio'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    raw_text = db.Column(db.Text)
    refined_text = db.Column(db.Text)
    json_data = db.Column(db.JSON)
    reasoning = db.Column(db.Text)
    form_name = db.Column(db.String(255))
    voice_processing_time = db.Column(db.Float)
    llm_processing_time = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_path': self.file_path,
            'raw_text': self.raw_text,
            'refined_text': self.refined_text,
            'json_data': self.json_data,
            'reasoning': self.reasoning,
            'form_name': self.form_name,
            'voice_processing_time': self.voice_processing_time,
            'llm_processing_time': self.llm_processing_time,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }