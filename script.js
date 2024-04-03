import { API_KEY } from './config.js';

const domainInput = document.getElementById('domainInput');
const checkButton = document.getElementById('checkButton');
const resultsContainer = document.getElementById('results');

checkButton.addEventListener('click', checkDomainAvailability);

async function checkDomainAvailability() {
    resultsContainer.innerHTML = ''; // Clear previous results
    const domains = domainInput.value.split('\n').filter(domain => domain.trim() !== '');

    if (domains.length === 0) {
        resultsContainer.innerHTML = '<p>Please enter some domains to check.</p>';
        return;
    }

    checkButton.disabled = true; // Disable button during API request
    try {
        const domainString = domains.join(",");
        const response = await fetch(`https://domainr.p.rapidapi.com/v2/status?mashape-key=${API_KEY}&domain=${domainString}`);
        if (!response.ok) {
            throw new Error('Failed to fetch domain availability.');
        }
        const data = await response.json();

        for (const domain of data.status) {
            const name = domain.domain
            const resultElement = document.createElement('p');
            if (domain.summary === 'inactive') {
                resultElement.textContent = `${name} is available`;
                resultElement.classList.add('available');
            } else {
                resultElement.textContent = `${name} is not available`;
                resultElement.classList.add('unavailable');
            }
            resultsContainer.appendChild(resultElement);
        }
    } catch (error) {
        resultsContainer.innerHTML = `<p>An error occurred: ${error.message}</p>`;
    } finally {
        checkButton.disabled = false; // Re-enable button after API request
    }
}
