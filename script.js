const domainInput = document.getElementById('domainInput');
const checkButton = document.getElementById('checkButton');
const resultsContainer = document.getElementById('results');
checkButton.addEventListener('click', checkDomainAvailability);

const testButton = document.getElementById('testbutton');

const TLDs = [];
fetch('TLDs.json')
    .then(response => response.json())
    .then(data => {
        TLDs.push(...data);
        console.log(TLDs);
    });


async function checkDomainAvailability() {
    resultsContainer.innerHTML = ''; // Clear previous results
    const domains = domainInput.value.split('\n').filter(domain => domain.trim() !== '');
    
    if (domains.length === 0) {
        resultsContainer.innerHTML = '<p>Please enter some domains to check.</p>';
        return;
    }

    const availableDomains = [];
    const unavailableDomains = [];
    const invalidDomains = [];

    checkButton.disabled = true; // Disable button during API request
    try {
        const domainString = domains.join(",");
        const response = await fetch(`https://api.matthewachandler.com/domains?domain=${domainString}`);
        if (!response.ok) {
            throw new Error('Failed to fetch domain availability.');
        }
        const data = await response.json();

        for (const domain of data.status) {
            const name = domain.domain
            const resultElement = document.createElement('p');

            const mainAvailable = domain.summary === 'inactive';
            
            if (mainAvailable) {
                availableDomains.push(name);
            } else {
                unavailableDomains.push(name);
            }
        }
        for (const domain of data.errors) {
            const domainInvalid = domain.code === 404;
            const name = domain.detail;
            if (domainInvalid) {
                invalidDomains.push(name);
            }
        }
    } catch (error) {
        resultsContainer.innerHTML = `<p>An error occurred: ${error.message}</p>`;
    } finally {
        checkButton.disabled = false; // Re-enable button after API request
    }

    for (const domain of availableDomains) {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${domain} is available`;
        resultElement.classList.add('available');
        resultsContainer.appendChild(resultElement);
    }
    for (const domain of unavailableDomains) {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${domain} is not available `;
        resultElement.classList.add('unavailable');
        resultsContainer.appendChild(resultElement);
    }
    for (const domain of invalidDomains) {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${domain} is invalid`;
        resultElement.classList.add('invalid');
        resultsContainer.appendChild(resultElement);
    }
}
