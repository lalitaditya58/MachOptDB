// MachOptDB Login Protection
if (!localStorage.getItem('machoptUser')) {
    window.location.href = 'login.html';
}

function logoutUser() {
    localStorage.removeItem('machoptUser');
    window.location.href = 'login.html';
}
