# iron-sentinel in full detail: built by foes/iron-sentinel/sentinel.py (the Iron Sentinels share one body; captain=False).
import os, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('sentinel_body', os.path.join(HERE, '..', 'iron-sentinel', 'sentinel.py'))
sentinel = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(sentinel)

def build(K):
    return sentinel.build(K, HERE, captain=False)
