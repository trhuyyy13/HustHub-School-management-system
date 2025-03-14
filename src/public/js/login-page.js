document.getElementById('selectRole').addEventListener('click', function() {
    const role = document.getElementById('role').value;
    document.getElementById('helloRole').textContent = `You are ${role}`;
    document.querySelector('.role-selection').style.display = 'none';
    document.querySelector('.login-details').style.display = 'block';
    document.querySelector('.login-container').style.width = '600px';
    document.querySelector('.login-container').style.height = 'auto';
    document.querySelector('.login-container').style.transform = 'scale(1.05)';
    setTimeout(() => {
        document.querySelector('.login-container').style.transform = 'scale(1)';
    }, 500);
});
