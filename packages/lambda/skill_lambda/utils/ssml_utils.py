def replace_special_characters(raw_text) -> str:
    raw_text = raw_text.replace("&", "&amp;")
    raw_text = raw_text.replace('"', "&quot;")
    raw_text = raw_text.replace("'", "&apos;")
    raw_text = raw_text.replace('<', "&lt;")
    raw_text = raw_text.replace('>', "&gt;")
    return raw_text

