from sqlalchemy.orm import Session

def get_or_create(db: Session, model, filters: dict, defaults: dict = None):
    instance = db.query(model).filter_by(**filters).first()
    if instance:
        return instance, False

    params = {**filters, **(defaults or {})}
    instance = model(**params)
    db.add(instance)
    return instance, True