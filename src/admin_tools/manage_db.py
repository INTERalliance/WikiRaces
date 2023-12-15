import os
from pymongo import MongoClient

# mongodb url will use service name in docker compose
mongo_url = os.environ["MONGODB_URL"] or "mongodb://127.0.0.1:27017"
client = MongoClient(mongo_url)
db = client.wikiRaces

print("This script is for managing WikiRace users and usernames.")
print()


def take_and_confirm_input(prompt):
    print(prompt)
    choice = input("> ")

    print("Does that look good? (y/n)")
    confirm = input("> ")
    if confirm == "y":
        return choice
    elif confirm == "n":
        print("Cancelled - Exiting.")
        exit(1)
    else:
        return take_and_confirm_input(prompt)


def list_users():
    print("Listing users. \n")
    for item in db.users.find():
        print(f'name = "{item["name"]}"')


def get_usernames():
    users = []
    for item in db.users.find():
        users.append(str(item["name"]))
    return list(users)


def list_full_user_data():
    print("Listing users. \n")
    for item in db.users.find():
        print(item)


def list_users_with_ids():
    print("Listing users with ids. \n")
    for item in db.users.find():
        print(f'userId = "{item["userId"]}" \t name = "{item["name"]}"')


def get_ids_of_username(username=None):
    if not username:
        print("What is the username you want to get the id of?")
        username = str(input("> "))
    user_ids = []
    for item in db.users.find({"name": username}):
        print("Found the following users:")
        print(f'userId = "{item["userId"]}"\t name = "{item["name"]}"')
        user_ids += "".join(item["userId"])
    return user_ids


def change_username_by_user_id(user_id=None):
    if not user_id:
        print("What is the user id you want to modify?")
        user_id = str(input("> "))
    users_with_id = list(db.users.find({"userId": user_id}))
    num_of_users_with_id = len(users_with_id)
    if num_of_users_with_id != 1:
        print(f"Error. {num_of_users_with_id} users have that id.")
        exit(1)
    new_name = take_and_confirm_input("What should the new name be?")
    user = users_with_id[0]
    user["name"] = new_name
    db.users.find_one_and_replace({"userId": user_id}, user)


def change_username_by_username():
    username = take_and_confirm_input("What username do you want to modify?")
    ids = get_ids_of_username(username)
    ids = "".join(ids)
    change_username_by_user_id(ids)


def cancel():
    print("Cancelled - nothing written")
    exit(1)


# This is stolen from an old project of mine
def take_input(commands, word="command"):
    if len(commands) == 1:
        print(f"Only one {word} found.")
        return commands[0]

    print(f"Pick a choice from the following {word}s:")

    for i, item in enumerate(commands, 1):
        if word == "command":
            print(f"\t{i} - {item.__name__}")
        else:
            print(f"\t{i} - {item}")

    print(f"\nPress ENTER for last {word}, or type an individual number. \n")

    choice = input("> ")

    # if there is no entry, assume the user wants the last chapter
    if choice == "":
        return commands[len(commands) - 1]
    else:
        try:
            choice.strip()
            choice = int(choice) - 1  # account for one index
            return commands[choice]
        except IndexError:
            print("That index was out of range.\n")
            return take_input(commands, word)
        except:
            print("Enter a number, or hit enter.\n")
            return take_input(commands, word)


def change_username_from_selection():
    print("Choosing from selection:")
    print()
    username = take_input(get_usernames(), "username")
    ids = get_ids_of_username(username)
    ids = "".join(ids)
    change_username_by_user_id(ids)

def delete_all_users():
    print("DELETING ALL USERS")
    db.users.delete_many({})

list_of_commands = [
    change_username_from_selection,
    change_username_by_username,
    change_username_by_user_id,
    list_users,
    list_users_with_ids,
    get_ids_of_username,
    list_full_user_data,
    delete_all_users,
    cancel,
]

choice = take_input(list_of_commands)
choice()

print("")
print("exited")
client.close()
