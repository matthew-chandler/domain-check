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
    });

async function checkDomainAvailability() {
    resultsContainer.innerHTML = ''; // clear previous results
    const domains = domainInput.value.split('\n').filter(domain => domain.trim() !== '');
    
    // ensure at least one domain was entered
    if (domains.length === 0) {
        resultsContainer.innerHTML = '<p>Please enter some domains to check.</p>';
        return;
    }

    // add alternative domains
    const altDomains = [];
    for (const name of domains) {
        const SLD = name.split(".")[0];
        const satisfiedEndings = TLDs.filter(ending => SLD.endsWith(ending.replace(".","")));
        for (const ending of satisfiedEndings)
            altDomains.push(SLD.slice(0,-ending.replace(".","").length)+ending);
    }
    const domainString = (domains.concat(altDomains)).join(",");

    const availableDomains = [];
    const unavailableDomains = [];
    const alternativeDomains = [];
    const invalidDomains = [];    

    checkButton.disabled = true; // Disable button during API request
    try {
        const response = await fetch(`https://api.matthewachandler.com/domains?domain=${domainString}`);
        if (!response.ok) {
            throw new Error('Failed to fetch domain availability.');
        }
        const data = await response.json();

        // handle valid domains
        for (const domain of data.status) {
            const name = domain.domain            
            
            // check if the domain is registerable to the general public and available on namecheap
            const registerable = TLDs.some(ending => name.endsWith(ending));
            const mainAvailable = domain.summary === 'inactive';
            const isAlternative = altDomains.includes(name);

            // handle alternative domains
            if (isAlternative) {
                if (mainAvailable && registerable)
                    alternativeDomains.push(name);
            } else { // handle regular domains
                if (mainAvailable && registerable)
                    availableDomains.push(name);
                else
                    unavailableDomains.push(name);
            }
        }
        // handle invalid domains
        if (data.errors)
            for (const domain of data.errors) {
                const domainInvalid = domain.code === 404;
                const name = domain.detail;
                if (domainInvalid && !altDomains.includes(name)) {
                    invalidDomains.push(name);
                }
            }
    } catch (error) {
        resultsContainer.innerHTML = `<p>An error occurred: ${error.message}</p>`;
    } finally {
        checkButton.disabled = false; // Re-enable button after API request
    }

    for (const domain of availableDomains) {
        // checks alternatives
        const allVariations = [domain];
        const SLD = domain.split(".")[0];
        const satisfiedEndings = TLDs.filter(ending => SLD.endsWith(ending.replace(".","")));
        for (const ending of satisfiedEndings) {
            const altDomain = SLD.slice(0,-ending.replace(".","").length)+ending;
            if (alternativeDomains.includes(altDomain))
                allVariations.push(altDomain);
        }

        const resultElement = document.createElement('p');
        if (allVariations.length === 1)
            resultElement.textContent = `${allVariations[0]} is available`;
        else if (allVariations.length === 2)
            resultElement.textContent = `${allVariations[0]}, as well as ${allVariations[1]} are available`;
        else if (allVariations.length === 3)
            resultElement.textContent = `${allVariations[0]}, as well as ${allVariations[1]} and ${allVariations[2]} are available`;
        else if (allVariations.length >= 4) {
            const alternativeString = allVariations.slice(1,allVariations.length-1).join(", ") + ", and " + allVariations[allVariations.length-1];
             resultElement.textContent = `${allVariations[0]}, as well as ${alternativeString} are available`;
        }    
        resultElement.classList.add('available');
        resultsContainer.appendChild(resultElement);
    }
    for (const domain of unavailableDomains) {
        // checks alternatives
        const allVariations = [domain];
        const SLD = domain.split(".")[0];
        const satisfiedEndings = TLDs.filter(ending => SLD.endsWith(ending.replace(".","")));
        for (const ending of satisfiedEndings) {
            const altDomain = SLD.slice(0,-ending.replace(".","").length)+ending;
            if (alternativeDomains.includes(altDomain))
                allVariations.push(altDomain);
        }
        
        const resultElement = document.createElement('p');
        resultElement.textContent = `${allVariations[0]} is not available` + (allVariations.length !== 1 ? ", " : "");
        resultElement.classList.add('unavailable');
        if (allVariations.length !== 1) {
            const alternativeText = document.createElement('span');
            if (allVariations.length === 2)
                alternativeText.textContent = `but ${allVariations[1]} is`;
            else if (allVariations.length === 3)
                alternativeText.textContent = `but ${allVariations[1]} and ${allVariations[2]} are`;
            else if (allVariations.length >= 4) {
                const alternativeString = allVariations.slice(1,allVariations.length-1).join(", ") + ", and " + allVariations[allVariations.length-1];
                alternativeText.textContent = `but ${alternativeString} are`;
            }    
            alternativeText.classList.add('alternatives');
            resultElement.appendChild(alternativeText);
        }        
        resultsContainer.appendChild(resultElement);
    }
    for (const domain of invalidDomains) {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${domain} is invalid`;
        resultElement.classList.add('invalid');
        resultsContainer.appendChild(resultElement);
    }
}