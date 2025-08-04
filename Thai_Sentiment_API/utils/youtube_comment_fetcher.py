from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_RECENT

def fetch_comments(video_url: str, limit: int = 250):
    downloader = YoutubeCommentDownloader()
    try:
        comments = []
        for comment in downloader.get_comments_from_url(video_url, sort_by=SORT_BY_RECENT):
            text = comment.get("text").strip()
            if text and len(text) <= 400:
                comments.append(text)
            if len(comments) >= limit:
                break
        return comments
    except Exception as e:
        print(f"[YouTube Error] {e}")
        return []