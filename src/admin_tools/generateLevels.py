import dateparser
import datetime
import os
import json
from shutil import copyfile

epoch = datetime.datetime.utcfromtimestamp(0)

levels = {}

cursor = "> "


def backup():
    source = os.path.join(os.pardir, "game/game_static/levels.json")
    destination = os.path.join(os.pardir, "game/game_static/BU_levels.json")
    copyfile(source, destination)


def set_json(raw_string: str):
    with open(os.path.join(os.pardir, "game/game_static/levels.json"), 'w') as file:
        return file.write(raw_string)


def get_time() -> str:
    time = dateparser.parse(input(cursor))
    while time == None:
        print("Invalid time.")
        time = dateparser.parse(input(cursor))
    return time.isoformat()


i = 0
def get_name() -> str:
    global i
    i += 1
    print(f"Using 'level{i}'")
    return f"level{i}"


def start_time() -> str:
    print("Enter the time the level should open. (e.g. 'in 3 min', 'Fri, 12 Dec 2021 10:55:50)'")
    return get_time()


def end_time() -> str:
    print("Enter the time the level should close. (e.g. 'in 10 min', 'Fri, 12 Dec 2021 10:59:00')")
    return get_time()


def start_page():
    print("Enter the part of the wikipedia url after 'https://en.wikipedia.org/wiki/' for the starting page.")
    return input(cursor)


def end_page():
    print("Enter the part of the wikipedia url after 'https://en.wikipedia.org/wiki/' for the ending page.")
    return input(cursor)


def generate_level():
    return {
        "name": get_name(),
        "startTime": "",
        "endTime": "",
        "startPage": start_page(),
        "endPage": end_page()
    }


def add_level():
    level = generate_level()
    levels[level["name"]] = level


def accept(prompt, repeat=True):
    print(prompt)
    choice = input("> ")
    if choice == "y":
        return True
    elif choice == "n":
        return False
    else:
        return accept("Please specify (y/n)")


while accept("Would you like to add another level? (y/n)"):
    add_level()

if accept("Would you like to save these levels? (y/n)"):
    print("Written and backed up")
    backup()
    set_json(json.dumps(levels, indent=4))
    print("Level start and end points were created.")
    print("You need to run setTime.py now.")
else:
    print("Cancelled - Nothing written")
