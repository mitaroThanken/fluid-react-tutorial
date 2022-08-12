import React, { useEffect, useState } from 'react';
import { TinyliciousClient } from "@fluidframework/tinylicious-client";
import { ContainerSchema, IFluidContainer, ISharedMap, LoadableObjectRecord, SharedMap } from 'fluid-framework';
import './App.css';

interface IFluidData extends LoadableObjectRecord {
  sharedTimestamp: ISharedMap;
}

function App() {
  const getFluidContainer = async () => {

    // TODO 1: Configure the container.
    const client = new TinyliciousClient();
    const containerSchema: ContainerSchema = {
      initialObjects: { sharedTimestamp: SharedMap }
    };

    // TODO 2: Get the container from the Fluid service.
    let container;
    const containerId = document.location.hash.substring(1);
    if (!containerId) {
      ({ container } = await client.createContainer(containerSchema));
      const id = await container.attach();
      document.location.hash = id;
    } else {
      ({ container } = await client.getContainer(containerId, containerSchema));
    }

    // TODO 3: Return the Fluid container.
    return container;
  }

  const [fluidContainer, setFluidContainer] = useState<IFluidContainer>();
  const [fluidSharedObjects, setFluidSharedObjects] = useState<IFluidData>();

  useEffect(() => {
    if (fluidSharedObjects !== undefined) return;
    (async () => {
      const container = await getFluidContainer();
      setFluidContainer(container);
      setFluidSharedObjects(container.initialObjects as IFluidData);
    })();
  }, [fluidSharedObjects]);

  const [localTimestamp, setLocalTimestamp] = React.useState<{ time: string | undefined }>();

  useEffect(() => {
    if (fluidSharedObjects) {

      // TODO 4: Set the value of the localTimestamp state object that will appear in the UI.
      const { sharedTimestamp } = fluidSharedObjects;
      const updateLocalTimestamp = () => setLocalTimestamp({ time: sharedTimestamp.get("time") });

      updateLocalTimestamp();

      // TODO 5: Register handlers.
      sharedTimestamp.on("valueChanged", updateLocalTimestamp);

      // TODO 6: Delete handler registration when the React App component is dismounted.
      return () => { sharedTimestamp.off("valueChanged", updateLocalTimestamp) };
    } else {
      return; // Do nothing because there is no Fluid SharedMap object yet.
    }
  }, [fluidSharedObjects]);

  const [isDirty, setIsDirty] = useState<boolean>();

  useEffect(() => {
    if (fluidContainer === undefined) return;

    const updateIsDirty = (event: string) => () => {
      console.info(`${event}: ${fluidContainer.isDirty}`);
      setIsDirty(fluidContainer.isDirty);
    };
    const handleSaved = updateIsDirty("saved");
    const handleDirty = updateIsDirty("dirty");
    fluidContainer.on("saved", handleSaved);
    fluidContainer.on("dirty", handleDirty);
    if (isDirty === undefined) {
      updateIsDirty("Init")();
    }

    return () => {
      fluidContainer.off("saved", handleSaved);
      fluidContainer.off("dirty", handleDirty);
    }
  }, [fluidContainer, isDirty]);

  if ((fluidSharedObjects === undefined) || (localTimestamp === undefined)) {
    return <div className="App" />
  }

  return (
    <div className="App">
      <button onClick={() => fluidSharedObjects.sharedTimestamp.set("time", Date.now().toString())}>
        Get Time
      </button>
      <p>{localTimestamp.time}</p>
      <p>{isDirty ? "dirty" : "clean"}</p>
    </div>
  );
}

export default App;
