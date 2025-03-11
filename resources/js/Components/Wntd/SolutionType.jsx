import React from 'react'

const SolutionType = (props) => {
  
    console.log(props);
    return props.value ? (
        <span>
          {props.value}
        </span>
    ) : (
        <React.Fragment></React.Fragment>
    );
  
}

export default SolutionType