from app.utils.suggestions import extract_keywords_from_text, DOMAIN_STOPWORDS


def test_extract_keywords_prunes_domain_tokens():
    text = "Hiking merit badge teaches outdoor skills including navigation and cooking"
    kws = extract_keywords_from_text(text)
    # Ensure domain stopwords are removed
    for token in DOMAIN_STOPWORDS:
        assert token not in kws
    # Ensure meaningful tokens retained
    for expected in ["hiking", "navigation", "cooking"]:
        assert expected in kws


def test_extract_keywords_min_length_and_stopwords():
    text = "The scout will learn about GPS and map use"
    kws = extract_keywords_from_text(text)
    assert "the" not in kws  # common stopword
    assert "will" not in kws
    assert "learn" not in kws  # domain-specific
    assert "scout" in kws  # not pruned (not listed)
    assert "gps" in kws
    assert "map" in kws
