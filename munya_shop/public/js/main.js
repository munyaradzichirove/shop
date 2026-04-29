function getGuestId() {
    let id = localStorage.getItem("guest_id");

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("guest_id", id);
    }

    return id;
}