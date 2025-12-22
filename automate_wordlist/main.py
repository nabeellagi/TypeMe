from collections import defaultdict

# Config
WORD_CATEGORIES = {
    "nouns": {
        "input": "nouns.txt",
        "output": "../game/src/core/wordlist/nouns.js"
    },
    "verbs": {
        "input": "verbs.txt",
        "output": "../game/src/core/wordlist/verbs.js"
    },
    "adjectives": {
        "input": "adjectives.txt",
        "output": "../game/src/core/wordlist/adjectives.js"
    }
}

# Load Word List
def load_words(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return [line.strip().lower() for line in f]
def load_profanity(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return set(line.strip().lower() for line in f)

# Length
LENGTH_NAME = {
    4: "fourLetters",
    5: "fiveLetters",
    6: "sixLetters", 7: "sevenLetters"
}

# SCORE
LETTER_FREQUENCY = {
    "e": 1, "t": 1, "a": 1, "o": 1, "i": 1, "n": 1,
    "r": 1, "s": 1, "h": 1,

    "l": 2, "d": 2, "c": 2, "u": 2, "m": 2,
    "f": 2, "y": 2, "w": 2, "g": 2, "p": 2,

    "b": 3, "v": 3, "k": 3,

    "x": 4, "q": 4, "j": 4, "z": 4,
}

def score_word(word):
    score = 0

    # Letter rarity scoring
    for c in word:
        score += LETTER_FREQUENCY.get(c, 2)

    # Repeated-letter penalty
    unique_letters = set(word)
    repeat_penalty = len(word) - len(unique_letters)
    score -= repeat_penalty  # 1 point per repeated letter

    # Safety clamp (never negative)
    return max(score, 1)

# Filter
def filter_words(words, profanity):
    buckets = {
        4: [],
        5: [],
        6: [],
        7: []
    }
    
    for word in words:
        if not word.isalpha():
            continue

        length = len(word)
        if length not in buckets:
            continue

        if word in profanity:
            continue

        buckets[length].append({
            "word": word,
            "score": score_word(word)
        })

    return buckets

# Sort and remove duplicates
def normalize_buckets(buckets):
    for length in buckets:
        seen = {}
        for item in buckets[length]:
            seen[item["word"]] = item  # dedupe by word

        buckets[length] = sorted(
            seen.values(),
            key=lambda x: x["word"]
        )

# Limits
MAX_PER_LENGTH = 100
MAX_PER_START_LETTER = 8

def balance_words(words):
    start_count = defaultdict(int)
    balanced = []

    for item in words:
        first_letter = item["word"][0]

        if start_count[first_letter] >= MAX_PER_START_LETTER:
            continue

        balanced.append(item)
        start_count[first_letter] += 1

        if len(balanced) >= MAX_PER_LENGTH:
            break

    return balanced

def apply_limits(buckets):
    for length in buckets:
        buckets[length] = balance_words(buckets[length])

# JS EXPORT
def export_js(buckets, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("// Auto-generated word list\n\n")
        
        for length in sorted(buckets):
            var_name = LENGTH_NAME[length]
            words = buckets[length]

            f.write(f"export const {var_name} = [\n")

            for item in words:
                f.write(
                    f'  {{ word: "{item["word"]}", score: {item["score"]} }},\n'
                )

            f.write("];\n\n")

def process_word_file(input_file, profanity):
    words = load_words(input_file)

    buckets = filter_words(words, profanity)
    normalize_buckets(buckets)
    apply_limits(buckets)

    return buckets

# MAIN LOOP
def main():
    profanity = load_profanity("profanity.txt")

    for name, config in WORD_CATEGORIES.items():
        print(f"Processing {name}...")

        buckets = process_word_file(config["input"], profanity)
        export_js(buckets, config["output"])

    print("All word lists generated successfully.")

if __name__ == "__main__":
    main()